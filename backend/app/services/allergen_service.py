"""User allergen ↔ food cross-check.

User-side allergens come from `User.allergies` (JSON list of strings the user
typed at onboarding). Food-side allergens come from `Food.allergens`
(ARRAY[Text] populated by Spoonacular/USDA ingest), with fall-back scanning
through `Food.ingredients` and `Food.name` so we still catch things like a
nut-allergic user looking at "Almond crusted salmon" even when no allergen
tag was attached upstream.

Output is a list of `AllergenHit`-shaped dicts so the API layer can surface
them on search results, photo analysis, and the log-confirmation modal.
"""

from __future__ import annotations

import re
from typing import Any, Dict, Iterable, List, Optional

# FDA "Big 9" plus a few high-prevalence offenders. Each canonical key maps to
# the set of substrings we'll match in user input or food allergen tags.
_CANONICAL_ALLERGENS: Dict[str, List[str]] = {
    "milk": ["milk", "dairy", "lactose", "casein", "whey", "cheese", "butter", "cream", "yogurt"],
    "egg": ["egg"],
    "fish": ["fish", "salmon", "tuna", "cod", "tilapia", "anchovy", "sardine"],
    "shellfish": ["shellfish", "shrimp", "lobster", "crab", "clam", "oyster", "scallop", "mussel"],
    "tree_nuts": [
        "tree nut", "almond", "cashew", "walnut", "pecan", "pistachio",
        "hazelnut", "brazil nut", "macadamia",
    ],
    "peanut": ["peanut"],
    "wheat": ["wheat", "gluten"],
    "soy": ["soy", "soya", "edamame", "tofu"],
    "sesame": ["sesame", "tahini"],
}


def _canonicalize(token: str) -> Optional[str]:
    """Map a user-typed allergy string to one of our canonical keys."""
    t = (token or "").strip().lower()
    if not t:
        return None
    # Direct hit on the key itself first.
    if t in _CANONICAL_ALLERGENS:
        return t
    for canonical, aliases in _CANONICAL_ALLERGENS.items():
        for alias in aliases:
            if alias in t:
                return canonical
    return None


def _user_allergen_keys(user_allergies: Optional[Iterable[Any]]) -> List[str]:
    if not user_allergies:
        return []
    keys: List[str] = []
    for raw in user_allergies:
        canon = _canonicalize(str(raw))
        if canon and canon not in keys:
            keys.append(canon)
    return keys


def _food_text(food: Any) -> str:
    """Concatenated lowercase haystack for ingredient/name fall-back match."""
    parts: List[str] = []
    name = getattr(food, "name", None)
    if name:
        parts.append(str(name))
    ingredients = getattr(food, "ingredients", None) or []
    parts.extend(str(i) for i in ingredients)
    description = getattr(food, "description", None)
    if description:
        parts.append(str(description))
    return " ".join(parts).lower()


def check_allergens(food: Any, user: Any) -> List[Dict[str, Any]]:
    """Return AllergenHit-shaped dicts for every user allergen the food contains.

    Matching priority: explicit `Food.allergens` > scan of name/ingredients.
    `severity` defaults to "block" when found in the explicit allergen list
    (signal is high-confidence) and "warn" for free-text scans.
    """
    user_keys = _user_allergen_keys(getattr(user, "allergies", None))
    if not user_keys:
        return []

    hits: List[Dict[str, Any]] = []
    food_allergens = [str(a).lower() for a in (getattr(food, "allergens", None) or [])]
    haystack = _food_text(food)

    for canonical in user_keys:
        aliases = _CANONICAL_ALLERGENS.get(canonical, [canonical])

        # Layer 1: explicit allergen tag on the Food row.
        if any(any(alias in tag for alias in aliases) for tag in food_allergens):
            hits.append(
                {
                    "allergen": canonical,
                    "matched_in": "allergens",
                    "severity": "block",
                }
            )
            continue

        # Layer 2: whole-word scan of name/ingredients/description.
        matched = False
        for alias in aliases:
            if re.search(r"\b" + re.escape(alias) + r"\b", haystack):
                hits.append(
                    {
                        "allergen": canonical,
                        "matched_in": "ingredients" if alias in haystack else "name",
                        "severity": "warn",
                    }
                )
                matched = True
                break
        if matched:
            continue

    return hits
