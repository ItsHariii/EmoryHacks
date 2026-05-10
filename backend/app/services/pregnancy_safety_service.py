"""Pregnancy safety pipeline.

Replaces the legacy flat-JSON lookup with a layered matcher that returns a
structured `SafetyVerdict` carrying ingredient-level findings, citations, and
a confidence score.

Layers, in order, highest-confidence wins (ties prefer most conservative):

  1. exact   — pattern equals the ingredient text (case-insensitive)
  2. prefix  — pattern is a whitespace-separated prefix of the ingredient
  3. category — Food.category (or USDA foodCategory) maps to a category rule
  4. fuzzy   — Jaccard token similarity ≥ FUZZY_THRESHOLD against any rule

Unmatched ingredients fall back to a conservative "limited / not yet reviewed"
finding so unfamiliar ingredients aren't silently called "safe".

Backward-compat: `get_safety_status()` and `check_food_safety()` keep their
prior signatures so existing callers continue to work.
"""

from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional, Tuple

logger = logging.getLogger(__name__)

# Confidence ceiling for any LLM-derived verdict. Keeps curated rules
# strictly superior so layer 5 can never silently override expert review.
_LLM_CONFIDENCE_CAP = 0.5

# Status precedence — higher index wins when escalating overall verdict.
_STATUS_RANK = {"safe": 0, "limited": 1, "avoid": 2}
_STATUS_LIST = ("safe", "limited", "avoid")

# Layer confidence — keep curated layers high so any future LLM/embedding layer
# (capped < 1.0) can never override a curated rule.
_LAYER_CONFIDENCE = {
    "exact": 1.0,
    "prefix": 0.92,
    "token": 0.85,
    "category": 0.8,
    "fuzzy": 0.7,
    "default": 0.2,
}

_FUZZY_THRESHOLD = 0.7
_DEFAULT_NOTES = (
    "Not yet reviewed against our rule set. Treat with caution and confirm "
    "with your healthcare provider before consuming during pregnancy."
)


def _max_status(a: str, b: str) -> str:
    return a if _STATUS_RANK[a] >= _STATUS_RANK[b] else b


def _tokenize(text: str) -> set[str]:
    return {tok for tok in re.split(r"[^a-z0-9]+", text.lower()) if tok}


def _jaccard(a: str, b: str) -> float:
    ta, tb = _tokenize(a), _tokenize(b)
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)


@dataclass
class _Rule:
    pattern: str
    pattern_type: str  # exact | prefix
    status: str
    severity_score: float
    trimester: str  # all | t1 | t2 | t3
    notes: str
    source_id: str
    category: Optional[str] = None
    amount_limit: Optional[Dict[str, Any]] = None


class PregnancySafetyService:
    """Layered pregnancy-safety matcher backed by a curated JSON rule set."""

    def __init__(self) -> None:
        self.rules: List[_Rule] = []
        self.categories: Dict[str, Dict[str, Any]] = {}
        self.sources: Dict[str, Dict[str, Any]] = {}
        # Memoized per-ingredient results so repeated calls in a request
        # (e.g., when the photo path checks both AI and USDA ingredient lists)
        # don't re-walk the rule list.
        self._lookup_cache: Dict[Tuple[str, str], Dict[str, Any]] = {}
        self._load()

    # ----------------------------- loading ------------------------------ #

    def _load(self) -> None:
        try:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            json_path = os.path.join(current_dir, "..", "data", "pregnancy_safety_rules.json")
            with open(json_path, "r") as f:
                payload = json.load(f)
        except Exception as e:  # pragma: no cover — config failure
            logger.error("Failed to load pregnancy safety rules: %s", e)
            return

        if isinstance(payload, dict) and "rules" in payload:
            self.sources = payload.get("sources", {}) or {}
            self.categories = payload.get("categories", {}) or {}
            for raw in payload.get("rules", []):
                try:
                    self.rules.append(self._parse_rule(raw))
                except Exception as e:  # pragma: no cover — bad data
                    logger.warning("Skipping malformed safety rule %r: %s", raw, e)
        else:
            # Legacy flat-dict shape — convert in-memory so older deploys
            # don't immediately break if they ship the old data file.
            for key, val in (payload or {}).items():
                self.rules.append(
                    _Rule(
                        pattern=key.replace("_", " "),
                        pattern_type="exact",
                        status=val.get("status", "limited"),
                        severity_score=0.7,
                        trimester="all",
                        notes=val.get("notes", ""),
                        source_id="internal_v1",
                    )
                )

        # Sort prefix rules longest-first so "raw fish" wins over "fish".
        self.rules.sort(key=lambda r: -len(r.pattern))
        logger.info(
            "Loaded %d pregnancy safety rules across %d categories / %d sources",
            len(self.rules), len(self.categories), len(self.sources),
        )

    @staticmethod
    def _parse_rule(raw: Dict[str, Any]) -> _Rule:
        pattern = raw["pattern"].lower().strip()
        pattern_type = raw.get("pattern_type", "exact")
        if pattern_type not in ("exact", "prefix"):
            pattern_type = "exact"
        status = raw.get("status", "limited")
        if status not in _STATUS_LIST:
            status = "limited"
        return _Rule(
            pattern=pattern,
            pattern_type=pattern_type,
            status=status,
            severity_score=float(raw.get("severity_score", 0.5)),
            trimester=raw.get("trimester") or "all",
            notes=raw.get("notes", "") or "",
            source_id=raw.get("source_id", "internal_v1"),
            category=raw.get("category"),
            amount_limit=raw.get("amount_limit"),
        )

    # --------------------------- public API ----------------------------- #

    def cited_source(self, source_id: Optional[str]) -> Optional[Dict[str, Any]]:
        if not source_id:
            return None
        meta = self.sources.get(source_id)
        if not meta:
            return None
        return {
            "id": source_id,
            "label": meta.get("label", source_id),
            "url": meta.get("url"),
            "last_reviewed": meta.get("last_reviewed"),
        }

    def evaluate(
        self,
        ingredients: Iterable[str],
        *,
        food_category: Optional[str] = None,
        trimester: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Run the full pipeline and return a SafetyVerdict-shaped dict."""

        trimester_label = self._normalize_trimester(trimester)
        ingredient_list = [str(i).strip() for i in ingredients if str(i).strip()]
        findings: List[Dict[str, Any]] = []
        seen_sources: Dict[str, Dict[str, Any]] = {}
        trimester_hit = False
        amount_guidance: Optional[Dict[str, Any]] = None

        # Always evaluate at least one item so empty ingredient lists still
        # surface a "no info" finding rather than a confident "safe".
        targets = ingredient_list or [""]

        for ing in targets:
            finding = self._evaluate_one(ing, trimester_label, food_category)
            findings.append(finding)
            if finding.get("source"):
                seen_sources[finding["source"]["id"]] = finding["source"]
            if finding.get("trimester_specific"):
                trimester_hit = True
            limit = finding.get("amount_limit")
            if limit and not amount_guidance:
                amount_guidance = limit

        overall_status = "safe"
        avoid_names: List[str] = []
        limited_names: List[str] = []
        for f in findings:
            overall_status = _max_status(overall_status, f["status"])
            if f["status"] == "avoid" and f.get("ingredient"):
                avoid_names.append(f["ingredient"])
            elif f["status"] == "limited" and f.get("ingredient"):
                limited_names.append(f["ingredient"])

        # Verdict confidence is the min over per-ingredient confidence so a
        # single fuzzy/default match drags down a list of exact hits.
        confidence = min((f["confidence"] for f in findings), default=0.0)

        if overall_status == "avoid":
            summary = (
                f"Avoid during pregnancy due to: {', '.join(sorted(set(avoid_names)))}"
                if avoid_names
                else "Avoid during pregnancy."
            )
        elif overall_status == "limited":
            summary = (
                f"Consume in moderation due to: {', '.join(sorted(set(limited_names)))}"
                if limited_names
                else "Consume in moderation during pregnancy."
            )
        else:
            summary = "Generally safe to consume during pregnancy."

        return {
            "status": overall_status,
            "confidence": round(confidence, 2),
            "summary": summary,
            "ingredient_findings": findings,
            "cited_sources": list(seen_sources.values()),
            "trimester": trimester_label,
            "trimester_specific": trimester_hit,
            "amount_guidance": amount_guidance,
            "reviewed_by_human": True,
        }

    async def evaluate_async(
        self,
        ingredients: Iterable[str],
        *,
        food_category: Optional[str] = None,
        trimester: Optional[int] = None,
    ) -> Dict[str, Any]:
        """Like evaluate() but with an optional Gemini layer-5 fallback for
        verdicts that only hit the default layer.

        The LLM call is gated on `settings.ENABLE_GEMINI_SAFETY_LAYER` so it
        stays off until prompts and cost budgets are dialed in. Confidence is
        always capped at _LLM_CONFIDENCE_CAP and reviewed_by_human is set
        False so the UI shows the "AI-assisted, not clinically reviewed"
        banner.
        """
        verdict = self.evaluate(
            ingredients, food_category=food_category, trimester=trimester
        )

        try:
            from app.core.config import settings  # local import to avoid cycle
            if not getattr(settings, "ENABLE_GEMINI_SAFETY_LAYER", False):
                return verdict
        except Exception:
            return verdict

        # Only invoke the LLM when every per-ingredient finding fell to the
        # default layer. A single curated hit is enough to keep the verdict.
        findings = verdict.get("ingredient_findings", []) or []
        if not findings or any(
            (f.get("matched_layer") or "default") != "default" for f in findings
        ):
            return verdict

        ingredient_list = [
            (f.get("ingredient") or "").strip() for f in findings
        ]
        ingredient_list = [i for i in ingredient_list if i]
        if not ingredient_list:
            return verdict

        llm_verdict = await self._gemini_verdict(
            ingredient_list,
            food_category=food_category,
            trimester=verdict.get("trimester", "all"),
        )
        if llm_verdict is None:
            return verdict

        # Replace the verdict but keep our trimester / amount metadata.
        llm_verdict["trimester"] = verdict.get("trimester", "all")
        llm_verdict["trimester_specific"] = False
        llm_verdict["reviewed_by_human"] = False
        return llm_verdict

    async def _gemini_verdict(
        self,
        ingredients: List[str],
        *,
        food_category: Optional[str],
        trimester: str,
    ) -> Optional[Dict[str, Any]]:
        """Call Gemini with a structured-output prompt and parse JSON back.

        Returns None on any failure (config missing, timeout, malformed
        response) so the caller can fall back to the curated verdict.
        """
        try:
            from app.services.ai_client import (
                food_gemini_client,
                extract_text_from_response,
                AIServiceUnavailable,
                AIRequestFailed,
            )
        except Exception as exc:  # pragma: no cover — import guard
            logger.warning("Gemini layer: import failed (%s)", exc)
            return None

        if not getattr(food_gemini_client, "is_available", False):
            return None

        category_line = f"Food category: {food_category}\n" if food_category else ""
        trimester_line = f"Trimester: {trimester}\n" if trimester and trimester != "all" else ""

        prompt = (
            "You are a pregnancy-nutrition reviewer. Classify the following "
            "ingredients for pregnancy safety and return ONLY valid JSON "
            "matching the schema below. No prose, no markdown fences.\n\n"
            f"{category_line}{trimester_line}"
            f"Ingredients: {ingredients}\n\n"
            "Schema:\n"
            "{\n"
            '  "status": "safe" | "limited" | "avoid",\n'
            '  "summary": "<1-sentence rationale>",\n'
            '  "ingredient_findings": [\n'
            "    {\n"
            '      "ingredient": "<name>",\n'
            '      "status": "safe" | "limited" | "avoid",\n'
            '      "notes": "<short reason>",\n'
            '      "matched_layer": "llm"\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "Be conservative: when uncertain, prefer 'limited' over 'safe'. "
            "Use 'avoid' only for clear pregnancy hazards (raw animal protein, "
            "high-mercury fish, alcohol, unpasteurized dairy, etc.)."
        )

        try:
            response = await food_gemini_client.generate_content(prompt)
        except (AIServiceUnavailable, AIRequestFailed) as exc:
            logger.warning("Gemini layer call failed: %s", exc)
            return None
        except Exception as exc:
            logger.warning("Gemini layer unexpected error: %s", exc, exc_info=True)
            return None

        text = extract_text_from_response(response)
        if not text:
            return None

        # Strip markdown code fences if the model added them despite the prompt.
        text = text.strip()
        if text.startswith("```"):
            text = text.strip("`")
            # tolerate ```json
            if text.lower().startswith("json"):
                text = text[4:]
        text = text.strip()

        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            logger.warning("Gemini layer JSON parse failed: %s | text=%r", exc, text[:200])
            return None

        if not isinstance(parsed, dict):
            return None

        status = parsed.get("status")
        if status not in _STATUS_LIST:
            return None

        raw_findings = parsed.get("ingredient_findings") or []
        if not isinstance(raw_findings, list):
            raw_findings = []

        normalized_findings: List[Dict[str, Any]] = []
        for entry in raw_findings:
            if not isinstance(entry, dict):
                continue
            f_status = entry.get("status")
            if f_status not in _STATUS_LIST:
                f_status = "limited"
            normalized_findings.append({
                "ingredient": str(entry.get("ingredient", "")).strip(),
                "status": f_status,
                "notes": str(entry.get("notes", "")).strip(),
                "matched_pattern": None,
                "matched_layer": "llm",
                "category": None,
                "source": {
                    "id": "gemini",
                    "label": "AI-assisted estimate (not clinically reviewed)",
                    "url": None,
                    "last_reviewed": None,
                },
                "confidence": _LLM_CONFIDENCE_CAP,
                "amount_limit": None,
                "trimester_specific": False,
            })

        summary = str(parsed.get("summary") or "").strip() or (
            "AI-assisted estimate — confirm with your healthcare provider."
        )

        return {
            "status": status,
            "confidence": _LLM_CONFIDENCE_CAP,
            "summary": summary,
            "ingredient_findings": normalized_findings,
            "cited_sources": [
                {
                    "id": "gemini",
                    "label": "AI-assisted estimate (not clinically reviewed)",
                    "url": None,
                    "last_reviewed": None,
                }
            ],
            "trimester": "all",
            "trimester_specific": False,
            "amount_guidance": None,
            "reviewed_by_human": False,
        }

    # --------------------- backward-compat shims ------------------------ #

    def get_safety_status(self, ingredient_name: str) -> Dict[str, str]:
        """Legacy single-ingredient lookup. Returns {status, notes}."""
        finding = self._evaluate_one(ingredient_name, "all", None)
        return {"status": finding["status"], "notes": finding["notes"]}

    def check_ingredient_safety(
        self, ingredient_name: str, spoonacular_safety: Optional[str] = None
    ) -> Tuple[str, str]:
        info = self.get_safety_status(ingredient_name)
        return info["status"], info["notes"]

    def check_food_safety(
        self,
        ingredients: List[str],
        spoonacular_data: Optional[Dict] = None,
        *,
        food_category: Optional[str] = None,
        trimester: Optional[int] = None,
    ) -> Tuple[str, str, List[Dict]]:
        """Legacy food-level call. Returns (status, summary, findings)."""
        verdict = self.evaluate(
            ingredients,
            food_category=food_category,
            trimester=trimester,
        )
        legacy_findings = [
            {
                "name": f["ingredient"],
                "safety_status": f["status"],
                "safety_notes": f["notes"],
            }
            for f in verdict["ingredient_findings"]
            if f.get("ingredient")
        ]
        return verdict["status"], verdict["summary"], legacy_findings

    def get_safety_recommendations(self, safety_status: str) -> List[str]:
        recommendations = {
            "safe": [
                "This food is generally safe to consume during pregnancy",
                "Ensure proper food handling and cooking",
                "Wash fruits and vegetables thoroughly",
            ],
            "limited": [
                "Consume this food in moderation during pregnancy",
                "Follow specific preparation guidelines if applicable",
                "Consult your healthcare provider if you have concerns",
            ],
            "avoid": [
                "Avoid this food during pregnancy",
                "Choose safer alternatives",
                "Consult your healthcare provider for personalized advice",
            ],
        }
        return recommendations.get(safety_status, recommendations["safe"])

    # ----------------------------- internals ---------------------------- #

    @staticmethod
    def _normalize_trimester(trimester: Optional[int]) -> str:
        if trimester in (1, 2, 3):
            return f"t{trimester}"
        return "all"

    def _evaluate_one(
        self,
        ingredient_name: str,
        trimester_label: str,
        food_category: Optional[str],
    ) -> Dict[str, Any]:
        cache_key = (ingredient_name.lower().strip(), trimester_label, food_category or "")
        cached = self._lookup_cache.get(cache_key)
        if cached is not None:
            return cached

        ingredient_key = ingredient_name.lower().strip()

        rule, layer = self._match(ingredient_key, food_category, trimester_label)
        if rule is None:
            finding = {
                "ingredient": ingredient_name,
                "status": "limited",
                "notes": _DEFAULT_NOTES,
                "matched_pattern": None,
                "matched_layer": "default",
                "category": None,
                "source": self.cited_source("internal_v1"),
                "confidence": _LAYER_CONFIDENCE["default"],
                "amount_limit": None,
                "trimester_specific": False,
            }
        else:
            category_meta = self.categories.get(rule.category) if rule.category else None
            notes = rule.notes
            if not notes and category_meta:
                notes = category_meta.get("default_notes", "")
            source = self.cited_source(rule.source_id) or (
                self.cited_source(category_meta.get("default_source_id"))
                if category_meta else None
            )
            finding = {
                "ingredient": ingredient_name,
                "status": rule.status,
                "notes": notes,
                "matched_pattern": rule.pattern,
                "matched_layer": layer,
                "category": rule.category,
                "source": source,
                "confidence": _LAYER_CONFIDENCE[layer],
                "amount_limit": rule.amount_limit,
                "trimester_specific": rule.trimester != "all",
            }

        self._lookup_cache[cache_key] = finding
        return finding

    def _match(
        self,
        ingredient_key: str,
        food_category: Optional[str],
        trimester_label: str,
    ) -> Tuple[Optional[_Rule], str]:
        if not ingredient_key and not food_category:
            return None, "default"

        # Layer 1+2: exact then prefix scan over the curated rules. self.rules
        # is sorted longest-first so "raw fish" wins over "fish".
        prefix_match: Optional[_Rule] = None
        for rule in self.rules:
            if not self._trimester_applies(rule.trimester, trimester_label):
                continue
            if rule.pattern_type == "exact" and ingredient_key == rule.pattern:
                return rule, "exact"
            if rule.pattern_type == "prefix" and self._has_token_prefix(
                ingredient_key, rule.pattern
            ):
                # Don't return immediately — an exact match for the same key
                # later in the list (different pattern) would still be better.
                if prefix_match is None or len(rule.pattern) > len(prefix_match.pattern):
                    prefix_match = rule
        if prefix_match is not None:
            return prefix_match, "prefix"

        # Layer 3: token-contains — pattern appears as a whole token inside the
        # ingredient text. Sorted longest-first so "raw fish" wins over "fish".
        # Whole-word boundary prevents "ham"→"graham" / "egg"→"eggplant".
        if ingredient_key:
            for rule in self.rules:
                if rule.pattern_type != "exact":
                    continue
                if not self._trimester_applies(rule.trimester, trimester_label):
                    continue
                pattern = r"\b" + re.escape(rule.pattern) + r"\b"
                if re.search(pattern, ingredient_key):
                    return rule, "token"

        # Layer 4: category match — pick the highest-severity rule that shares
        # the food's category, so a specific rule beats the category default.
        if food_category:
            cat_key = self._normalize_category(food_category)
            if cat_key in self.categories:
                best: Optional[_Rule] = None
                for rule in self.rules:
                    if rule.category == cat_key and self._trimester_applies(
                        rule.trimester, trimester_label
                    ):
                        if best is None or rule.severity_score > best.severity_score:
                            best = rule
                if best is not None:
                    return best, "category"
                # No rule, but category itself has defaults — synthesize one.
                meta = self.categories[cat_key]
                return (
                    _Rule(
                        pattern=cat_key,
                        pattern_type="exact",
                        status=meta.get("default_status", "limited"),
                        severity_score=0.5,
                        trimester="all",
                        notes=meta.get("default_notes", ""),
                        source_id=meta.get("default_source_id", "internal_v1"),
                        category=cat_key,
                    ),
                    "category",
                )

        # Layer 4: fuzzy fallback — exact-pattern rules only, gated on trimester.
        if ingredient_key:
            best_score = 0.0
            best_rule: Optional[_Rule] = None
            for rule in self.rules:
                if rule.pattern_type != "exact":
                    continue
                if not self._trimester_applies(rule.trimester, trimester_label):
                    continue
                score = _jaccard(ingredient_key, rule.pattern)
                if score > best_score:
                    best_score = score
                    best_rule = rule
            if best_rule is not None and best_score >= _FUZZY_THRESHOLD:
                return best_rule, "fuzzy"

        return None, "default"

    @staticmethod
    def _trimester_applies(rule_trimester: str, current: str) -> bool:
        if rule_trimester == "all" or current == "all":
            return True
        return rule_trimester == current

    @staticmethod
    def _has_token_prefix(ingredient_key: str, pattern: str) -> bool:
        # Whole-token prefix so "deli meat" matches "deli meat sandwich" but
        # "ham" doesn't match "graham". Anchored at start.
        if not ingredient_key.startswith(pattern):
            return False
        rest = ingredient_key[len(pattern):]
        return rest == "" or not rest[0].isalnum()

    @staticmethod
    def _normalize_category(category: str) -> str:
        c = category.lower().strip()
        # Map common USDA / Spoonacular category strings to our keys.
        if "soft" in c and "cheese" in c:
            return "soft_cheese"
        if "deli" in c or "lunch meat" in c or "luncheon" in c:
            return "deli_meat"
        if "alcoholic" in c or "alcohol" in c:
            return "alcohol"
        return c.replace(" ", "_")


# Singleton for app-wide reuse
pregnancy_safety_service = PregnancySafetyService()
