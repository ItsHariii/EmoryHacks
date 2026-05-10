"""External API search coordination — parallel fan-out + scored merge.

Pipeline:
  1. Local DB results are already in `existing_results` (caller's responsibility).
  2. USDA and Open Food Facts are queried in parallel via asyncio.gather.
  3. Candidates from both APIs are scored against the query and merged.
  4. Spoonacular is consulted ONLY when the query classifies as a packaged
     product / recipe (food_classifier.classify_as_product) and we still
     need more results — Spoonacular has a tight 150 calls/day free tier.

Scoring (higher = better):
   +50  exact name match (case-insensitive)
   +30  startswith query
   +20  Jaccard token similarity ≥ 0.7
   +15  branded / verified
   +10  USDA confidence ≥ 0.8
    -5  zero calories (likely incomplete)
   -10  no ingredients on a branded item
"""
import asyncio
import logging
from sqlalchemy.orm import Session
from typing import List

from ....services.spoonacular_service import SpoonacularService
from ....services.usda_service import USDAService
from ....services.open_food_facts_service import open_food_facts_service
from ....services.food_classifier import classify_as_product
from ....schemas.food import FoodSearchResult
from .cache_manager import (
    cache_usda_ingredients,
    cache_usda_foods,
    cache_spoonacular_results,
    cache_off_results,
)

logger = logging.getLogger(__name__)

spoonacular_service = SpoonacularService()
usda_service = USDAService()


def _jaccard(a: str, b: str) -> float:
    sa = {t for t in a.lower().split() if t}
    sb = {t for t in b.lower().split() if t}
    if not sa or not sb:
        return 0.0
    return len(sa & sb) / len(sa | sb)


def _score_result(result: FoodSearchResult, query: str) -> float:
    """Score a candidate FoodSearchResult against the query."""
    name = (result.name or "").lower()
    q = query.lower().strip()
    score = 0.0

    if not name or not q:
        return score

    if name == q:
        score += 50
    elif name.startswith(q):
        score += 30
    elif _jaccard(q, name) >= 0.7:
        score += 20

    if result.brand:
        score += 15

    # FoodSearchResult lacks usda_confidence — checked downstream when we
    # have the Food row. Branded products still get the +15 bump above.

    if not result.calories:
        score -= 5

    return score


async def _safe_gather(*coros):
    """gather with return_exceptions=True so one source failing doesn't
    sink the rest. Logs the exception path."""
    return await asyncio.gather(*coros, return_exceptions=True)


async def search_external_apis(
    query: str,
    existing_results: List[FoodSearchResult],
    db: Session,
    max_results: int = 10,
) -> List[FoodSearchResult]:
    """Fan out to USDA + OFF in parallel, score-merge, then optionally
    backfill with Spoonacular if the query looks like a packaged product."""

    needed = max_results - len(existing_results)
    if needed <= 0:
        return []

    # Parallel raw fetches.
    usda_raw, off_raw = await _safe_gather(
        usda_service.search_foods(query, needed),
        open_food_facts_service.search_foods(query, needed),
    )

    if isinstance(usda_raw, Exception):
        logger.error("USDA search failed for '%s': %s", query, usda_raw)
        usda_raw = []
    if isinstance(off_raw, Exception):
        logger.error("OFF search failed for '%s': %s", query, off_raw)
        off_raw = []

    # Persist + transform sequentially (DB writes; can't parallelize safely).
    seen = list(existing_results)
    candidates: List[FoodSearchResult] = []

    if usda_raw:
        # USDA orchestrator already classifies ingredient vs food internally
        # via the calling layer — we route through the food path here so
        # branded items don't get coerced into ingredients.
        try:
            usda_results = await cache_usda_foods(usda_raw, db, seen, query)
            candidates.extend(usda_results)
            seen.extend(usda_results)
        except Exception as e:
            logger.error("cache_usda_foods failed for '%s': %s", query, e)

        # Backfill ingredient path so simple-food queries (e.g. "spinach")
        # still surface a USDA hit even if no Branded match exists.
        if len(candidates) < needed:
            try:
                usda_ing = await cache_usda_ingredients(usda_raw, db, seen)
                candidates.extend(usda_ing)
                seen.extend(usda_ing)
            except Exception as e:
                logger.error("cache_usda_ingredients failed for '%s': %s", query, e)

    if off_raw:
        try:
            off_results = await cache_off_results(off_raw, db, seen)
            candidates.extend(off_results)
            seen.extend(off_results)
        except Exception as e:
            logger.error("cache_off_results failed for '%s': %s", query, e)

    # Score-merge.
    scored = sorted(candidates, key=lambda r: _score_result(r, query), reverse=True)
    new_results = scored[:needed]

    # Spoonacular only on packaged-product queries when we still need fill.
    if len(new_results) < needed and classify_as_product(query):
        try:
            spoon_payload = await spoonacular_service.classify_and_search(
                query, needed - len(new_results)
            )
            spoon_foods = (spoon_payload or {}).get("results", []) or []
            search_type = (spoon_payload or {}).get("type", "ingredient")
            if spoon_foods:
                spoon_cached = await cache_spoonacular_results(
                    spoon_foods, search_type, db, existing_results + new_results
                )
                new_results.extend(spoon_cached[: needed - len(new_results)])
                logger.info(
                    "Spoonacular backfill returned %d for '%s' (type=%s)",
                    len(spoon_cached), query, search_type,
                )
        except Exception as e:
            logger.error("Spoonacular backfill failed for '%s': %s", query, e)

    return new_results
