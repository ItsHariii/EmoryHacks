# Food System — Architecture & Recent Changes

This doc covers the food **search → logging → pregnancy safety → allergen → barcode** pipeline end-to-end, the changes that landed in the most recent pushed commit, and the additional changes made in the current session that are not yet committed.

---

## TL;DR

Plain-English version of what changed and why it matters:

- **Search is now a parallel race, not a relay.** USDA + Open Food Facts queries fire simultaneously, results are scored against the query (exact name > startswith > token overlap), then dedup'd. Spoonacular only runs as a fallback when the query looks like a packaged product. Faster results, fewer wasted API calls, better relevance.
- **Barcode scanning runs through the backend now.** The phone used to call Open Food Facts directly with an in-memory cache that vanished on app restart. Now `GET /food/barcode/{code}` does the OFF lookup, persists a `Food` row, runs the pregnancy + allergen checks, and returns the same shape as a search hit. One scan creates a real cached row; the next user who scans the same product gets it instantly.
- **Pregnancy safety is layered and citable.** The old "match raw_salmon to raw salmon" bug is gone. New pipeline runs exact → prefix → token → category → fuzzy match against ~200 curated rules sourced from FDA, CDC, ACOG, NHS, WHO. Every verdict carries a confidence score and a citation URL the UI can link to.
- **Allergen detection cross-checks the user against the food.** User allergies (free-text) get canonicalized to FDA Big-9, then matched against `Food.allergens` tag (severity = `block`) or scanned in `Food.name`/`Food.ingredients` (severity = `warn`). Hits surface as a red/amber badge above the pregnancy badge.
- **Logging correctness fixed.** PATCH on a food log used to keep stale calories; now it recomputes when serving size/unit/quantity changes. Unknown serving units used to silently coerce to grams (`"100 blurps"` = 100g); now they 422. Daily summaries used to drop magnesium/zinc/potassium/choline/dha/omega3 even though the data was sitting in the database; now they're aggregated.
- **Photo analysis can't hang anymore.** 25-second hard timeout on the sync path; on miss the client gets a `retry_async` flag that points to the existing background job queue.

What's still deferred: DB-backed safety rules + admin curation, LLM verdict layer (Gemini structured output, capped at 0.5 confidence), per-food persisted `safety_verdict` column, idempotency middleware on log POST, and the `Report incorrect classification` flow.

---

## 1. Most recent pushed commit — `56b5a64 "backend improvements"`

Files relevant to the food system:

- **`backend/app/api/food/logging.py`** — refactor of food log CRUD. Cleaner USDA-prefixed (`usda_<fdc_id>`) handling on `POST /food/log`, calling `food_factory.create_food_from_usda` to materialize a local `Food` row before logging.
- **`backend/app/api/food/photo_analysis.py`** — sync vs async modes split. Async mode persists the upload to object storage and enqueues an arq job (`analyze_photo_job`) so heavy work survives process restarts. Sync mode runs Gemini Vision → USDA → safety check inline.
- **`backend/app/api/food/search/external_apis.py`** — sequential orchestration: local DB → Spoonacular `classify_and_search` → USDA fallback. Caps results at 10.
- **`backend/app/services/cache_service.py`** — `find_duplicates` / `cache_food` with cross-source dedup (exact API ID, exact name+brand, Jaccard ≥ 0.85). Per-source TTL.
- **`backend/app/services/rate_limiter.py`** — per-service token-bucket (Spoonacular 150/day, USDA 1000/hr, Gemini 60/min). HTTP client wrappers (`spoonacular_client`, `usda_client`) with retries + 429 handling.
- **`backend/app/services/usda_service.py`** — full nutrient-ID map (60+), description/brand/ingredient extraction, keyword-scan safety fallback.
- **`backend/app/services/spoonacular_service.py`** — `classify_and_search` heuristic to choose products vs ingredients.
- **`backend/app/workers/photo_worker.py`** — arq worker entry point for async photo analysis.
- **`backend/app/models/food.py`** — soft-delete / cache-expires fields.
- **Removed**: `unified_food_service.py`, `usda_safety_service.py`, `migrate_food_schema.py` (replaced by Alembic + the orchestration in `external_apis.py`).
- New CI / Dockerfile / pre-commit / Makefile housekeeping.

That commit landed the search-orchestration and infra plumbing. It did **not** touch the logged-nutrition correctness bugs, the silent serving-unit fallback, the broken daily aggregation, or the flat-JSON safety system. Those, plus the OFF backend integration, are what the current session fixes.

---

## 2. This session — P0 (correctness) + P1 (safety) + P2 (data sources)

### P0 — correctness fixes

| File | Change |
|------|--------|
| `backend/app/api/food/logging.py` | `PATCH /food/log/{log_id}` now recomputes `calories_logged` + `nutrients_logged` whenever `serving_size` / `serving_unit` / `quantity` changes, and returns the formatted response (was returning the raw SQLAlchemy row). |
| `backend/app/schemas/food.py` | `ServingUnit = Literal["g","ml","cup","tbsp","tsp","oz","lb","serving"]` enforced on `FoodLogCreate` / `FoodLogUpdate`. `FoodLogUpdate.serving_size` and `quantity` gain `gt=0`; `meal_type` gains the same regex pattern as `FoodLogCreate`. |
| `backend/app/schemas/food.py` | `DailyNutrition` extended: `magnesium_mg`, `zinc_mg`, `potassium_mg`, `choline_mg`, `dha_mg`, `omega3_mg`. `add_food()` rewritten to read macros from explicit `Food` columns and micros from `Food.micronutrients` JSONB using a key map matching the actually-stored form (USDA `lower().replace(' ', '_')`). DHA / omega-3 caught by substring hint (`22:6`, `dha`, `n-3`, `omega-3`). |
| `backend/app/services/nutrition_calculator_service.py` | Unknown serving unit now raises `ValueError` instead of silently coercing to grams (the old `UNIT_CONVERSIONS.get(unit, 1.0)` made `"100 blurps"` log as 100g). |
| `backend/app/api/food/nutrition.py` | `/nutrition-summary` aggregates the new micros from `log.nutrients_logged`. |
| `backend/app/api/food/logging.py` | `GET /food/log/weekly-summary` projection extended with the new fields. |
| `backend/app/core/config.py` | `PHOTO_ANALYSIS_TIMEOUT_S = 25`. |
| `backend/app/api/food/photo_analysis.py` | Sync `_perform_photo_analysis` wrapped in `asyncio.wait_for(..., timeout=settings.PHOTO_ANALYSIS_TIMEOUT_S)`. On timeout returns `{success: false, fallback_action: "retry_async"}` so the client can retry against the existing arq job path. |
| `ovi-frontend/app/hooks/useFoodEntry.ts` | Unknown unit returns `null` nutrition (instead of dividing by 100). `isValid` rejects unknown units. Empty unit still defaults to grams (legacy `"100"` input). |

### P1 — pregnancy safety pipeline + allergen system

| File | Change |
|------|--------|
| `backend/app/data/pregnancy_safety_rules.json` | **Restructured to v2 schema.** Top-level `sources`, `categories`, `rules`. 200 rules total (was 154): 56 `avoid`, 37 `limited`, 107 `safe`. Sources cited per-rule: **FDA fish 2024**, **CDC listeria**, **ACOG nutrition**, **NHS foods-to-avoid**, **WHO food safety**, internal_v1. Categories: `soft_cheese`, `high_mercury_fish`, `deli_meat`, `raw_animal_protein`, `alcohol`. Each rule now has `pattern`, `pattern_type` (`exact` / `prefix`), `category`, `status`, `severity_score`, `trimester`, `notes`, `source_id`, optional `amount_limit`. |
| `backend/app/services/pregnancy_safety_service.py` | **Full rewrite.** Layered matcher (highest-confidence wins, ties prefer most-conservative). Added `evaluate(...)` method returning a structured `SafetyVerdict` dict. Backward-compat shims preserved (`check_food_safety`, `check_ingredient_safety`, `get_safety_status`, `get_safety_recommendations`) so all existing callers still work unchanged. |
| `backend/app/services/allergen_service.py` | **New.** `check_allergens(food, user) -> List[AllergenHit]`. Cross-checks `User.allergies` against `Food.allergens` + scans `Food.ingredients` and `Food.name`. FDA "Big 9" canonicalization (`milk`, `egg`, `fish`, `shellfish`, `tree_nuts`, `peanut`, `wheat`, `soy`, `sesame`). Severity is `block` for explicit allergen-tag matches, `warn` for ingredient/name scans. |
| `backend/app/schemas/food.py` | New schemas: `CitedSource`, `AmountLimit`, `IngredientFinding`, `SafetyVerdict`, `AllergenHit`. Added optional `safety_verdict` and `allergen_hits` on `FoodResponse` and `FoodSearchResult`. |
| `backend/app/api/food/logging.py` | `_format_food_log_response` now takes `user`, computes verdict + allergen hits, returns them on the food payload. All callers (POST, GET-list, GET-single, PATCH) thread `current_user` through. |
| `backend/app/api/food/photo_analysis.py` | Sync analysis now calls `pregnancy_safety_service.evaluate()` with food category + user trimester. Response includes `safety_verdict` + `allergen_hits` (with synthetic-food fallback when no `Food` row was persisted). |
| `ovi-frontend/app/types/index.ts` | New types: `CitedSource`, `IngredientFinding`, `SafetyVerdict`, `AllergenHit`. Added optional `safety_verdict` and `allergen_hits` on `FoodItem`. |
| `ovi-frontend/app/components/safety/SafetyDisclaimer.tsx` | **New.** Centralized disclaimer (compact + full variants). Replaces scattered copies in modals. |
| `ovi-frontend/app/components/safety/AllergenBadge.tsx` | **New.** Red/amber badge stack for allergen hits with severity-driven copy ("Confirm before logging" for `block`, "Verify ingredients on the label" for `warn`). |
| `ovi-frontend/app/components/food/FoodSafetyBadge.tsx` | Accepts optional `verdict` prop. When present, modal renders: confidence meter, summary, **Why** section with per-ingredient findings (status pill + tappable citation chip), **Sources** section linking to authoritative URLs, AI-assisted banner when `reviewed_by_human=false`, centralized `<SafetyDisclaimer />` footer. Fully backward compatible — still works with just `notes`. |

### P2 — data sources (Open Food Facts backend + parallel scored search + barcode endpoint)

| File | Change |
|------|--------|
| `backend/app/models/food.py` | `FoodSource.OPEN_FOOD_FACTS = "open_food_facts"` enum value. New `off_id String(64)` indexed column on `Food` (UPC/EAN as string preserves leading zeros). The `foodsource` Postgres ENUM extended to include `'open_food_facts'`. |
| `backend/migrations/versions/d4e5f6a7b8c9_food_off_id_and_source.py` | **New Alembic migration** chained to head `c3d4e5f6a7b8`. Adds `foods.off_id` + index, `ALTER TYPE foodsource ADD VALUE IF NOT EXISTS 'open_food_facts'` inside an autocommit block. Downgrade drops the column; the orphan enum value is left in place (Postgres has no `DROP VALUE`). |
| `backend/app/core/config.py` | `EXTERNAL_RATE_LIMITS["open_food_facts"] = (60, 60)` — honors OFF's ≤1 req/sec polite usage. `CACHE_TTL_HOURS["open_food_facts"] = 24*14` (14 days; product data changes slowly). |
| `backend/app/services/rate_limiter.py` | New `off_client = APIClientWithLimiting("open_food_facts")` singleton sharing the rate limiter + retry handler. |
| `backend/app/services/open_food_facts_service.py` | **New.** Mirrors `usda_service` shape: `search_foods(query, page_size)` → OFF v2 `/search`, `get_by_barcode(code)` → `/product/{code}.json`, `parse_nutrients(product)` returns canonical keys (`calories`, `protein`, `carbs`, `fat`, `fiber`, `sugar`, `sodium`, `calcium`, `iron`, `magnesium`, `zinc`, `potassium`, `vitamin_a/c/d/e/b6/b12`, `folate`, `cholesterol`, `saturated_fat`, `trans_fat`, `caffeine`, `alcohol`, `choline`, `omega3`, `dha`), `extract_basic_info(product)` returns `{name, brand, description, category, ingredients, allergens, serving_size, serving_unit, barcode, nutriscore_grade}` with OFF allergen-tag prefix (`en:milk`) stripped. |
| `backend/app/utils/food_factory.py` | New `create_food_from_off(db, product)` static method. Dedupes on `off_id`, persists with canonical micros in `Food.micronutrients`, runs `pregnancy_safety_service.evaluate()` against parsed ingredients + category at ingest, tags `source = FoodSource.OPEN_FOOD_FACTS`. Race-safe via `IntegrityError` re-query on the unique index. |
| `backend/app/services/cache_service.py` | `find_duplicates`, `get_cached_food`, `cache_food`, `_merge_food_data` all extended with `off_id` parameter / cache-hit path / merge field. |
| `backend/app/api/food/search/result_builder.py` | New `build_off_food_result(food)` returning `FoodSearchResult` for OFF rows (parallels `build_usda_food_result`). Pulls sodium from `micronutrients.sodium.amount`. |
| `backend/app/api/food/search/cache_manager.py` | New `cache_off_results(off_products, db, existing_results)` that calls `food_factory.create_food_from_off` per product and skips name-collisions with already-found results. |
| `backend/app/api/food/search/external_apis.py` | **Rewritten.** Old sequential Spoonacular → USDA flow replaced with parallel `asyncio.gather(usda_service.search_foods, open_food_facts_service.search_foods)`. Candidates from both sources are persisted, then scored: exact match +50, startswith +30, Jaccard ≥0.7 +20, branded +15, no-calories -5. Scored desc, top-N taken, then Spoonacular runs only as a backfill when `food_classifier.classify_as_product(query) == True` and we still need more results. Failure of any source no longer sinks the others (`return_exceptions=True`). |
| `backend/app/api/food/lookup.py` | **New `GET /food/barcode/{code}` endpoint.** Validates UPC/EAN format (8/12/13/14 digits), checks `foods.off_id` cache, falls back to `open_food_facts_service.get_by_barcode()`, persists via `food_factory.create_food_from_off`, runs `pregnancy_safety_service.evaluate()` with the user's trimester, and returns the food row with `safety_verdict` + `allergen_hits`. Mounted before the catch-all `/{food_id}` route. |
| `ovi-frontend/app/services/api.ts` | New `foodAPI.lookupBarcode(code)` client calling `GET /food/barcode/{code}`. |
| `ovi-frontend/app/services/barcodeService.ts` | **Rewritten.** Removed direct OFF axios call, removed in-memory `Map` cache (backend now owns caching), removed `transformToFoodItem` helper. Now calls `foodAPI.lookupBarcode` and maps the backend response to the `FoodItem` shape the UI expects (carries through `safety_verdict`, `allergen_hits`, `ingredients`, `allergens`). `clearBarcodeCache()` retained as a no-op for callers; `isValidBarcodeFormat` unchanged. |

---

## 3. How food search works now

```
SearchFoodScreen.runSearch(query)
        │
        ▼
foodAPI.search(query) ──► GET /food/search?query=…
        │
        ▼
backend/app/api/food/search/__init__.py
   │
   ├── search_local_database(query)            ← already-cached Food rows
   │   (database.py: ranks exact match → is_verified → newest)
   │
   ├── search_external_apis(query, existing)   ← if local hits < max_results
   │       │
   │       ├── PARALLEL FAN-OUT (asyncio.gather, return_exceptions=True)
   │       │     ├── usda_service.search_foods(query)
   │       │     └── open_food_facts_service.search_foods(query)
   │       │
   │       ├── PERSIST (sequential, DB writes)
   │       │     ├── cache_usda_foods    → food_factory.create_food_from_usda
   │       │     ├── cache_usda_ingredients (backfill if branded misses)
   │       │     └── cache_off_results   → food_factory.create_food_from_off
   │       │       (each calls cache_service.cache_food → dedup by id/name/Jaccard
   │       │        and now off_id)
   │       │
   │       ├── SCORE-MERGE
   │       │     +50 exact name | +30 startswith | +20 Jaccard ≥ 0.7
   │       │     +15 branded   | -5 no calories
   │       │     sort desc, take top (max_results - existing)
   │       │
   │       └── SPOONACULAR BACKFILL (only when classify_as_product == True
   │           AND results still under quota)
   │
   └── build_search_results(foods, ingredients) → List[FoodSearchResult]
```

Rate limits and TTLs live in `backend/app/core/config.py`:

- `EXTERNAL_RATE_LIMITS`: `spoonacular: 150/day`, `usda: 1000/hr`, `open_food_facts: 60/min`, `gemini: 60/min`.
- `CACHE_TTL_HOURS`: `spoonacular: 7d`, `usda: 30d`, `open_food_facts: 14d`, `local: 3d`, `manual: 30d`.

Spoonacular is now backfill-only — saves the 150/day quota for queries that genuinely look like packaged products.

---

## 4. How food logging works (detailed)

This is the section most affected by this session.

### 4.1 The `food_logs` table

Schema in `backend/app/models/food.py` (FoodLog class):

| Column | Type | Notes |
|---|---|---|
| `id` | UUID PK | |
| `user_id` | UUID FK → users.id (CASCADE) | |
| `food_id` | UUID FK → foods.id (RESTRICT) | RESTRICT keeps historical logs valid even if food is soft-deleted. |
| `serving_size` | Float | User-chosen amount (e.g. 1.5). |
| `serving_unit` | String(20) | Now restricted to the `ServingUnit` enum at the API layer (was free-text). |
| `quantity` | Float | Multiplier — currently always 1.0 because `serving_size` already represents the consumed amount. |
| `consumed_at` | DateTime | Defaults to `utcnow()` in the schema. |
| `meal_type` | String | `breakfast` / `lunch` / `dinner` / `snack`. Validated by regex on the schema. |
| `notes` | String | Optional. |
| `calories_logged` | Float, default 0 | Computed from `food.calories * multiplier` at log time. |
| `nutrients_logged` | JSONB | `{ protein, carbs, fat, fiber, sugar, [+micronutrients] }` scaled to the logged serving. |
| `deleted_at` | DateTime, nullable, indexed | Soft-delete tombstone. All queries filter `deleted_at IS NULL`. |
| `created_at`, `updated_at` | DateTime | |

Indexes (from earlier migrations): `ix_food_logs_user_consumed`, `ix_food_logs_user_active_consumed`, `ix_food_log_deleted_at`.

### 4.2 The `POST /food/log` flow (after this session's changes)

```
Frontend: foodAPI.logFood({ food_id, serving_size, serving_unit, meal_type, ... })
        │
        ▼
log_food() in logging.py
   │
   ├── Resolve food
   │     • food_id starts with "usda_"   → fetch / materialize via food_factory.create_food_from_usda
   │     • else                           → SELECT * FROM foods WHERE id = food_id
   │
   ├── Validate (Pydantic)
   │     • serving_size > 0
   │     • serving_unit ∈ ServingUnit literal   ← NEW: was free-text, would silently coerce
   │     • meal_type matches breakfast|lunch|dinner|snack
   │
   ├── Compute nutrition
   │     NutritionCalculatorService.calculate_consumed_nutrition(
   │         food, user_serving_size, user_serving_unit, quantity=1.0
   │     )
   │     • convert_to_base_units(...)  ← NEW: raises ValueError on unknown unit
   │     • multiplier = (user_serving_grams / food_base_grams) * quantity
   │     • Returns { calories_logged, nutrients_logged }
   │
   ├── Insert FoodLog row, commit
   │
   └── _format_food_log_response(food_log, food, user=current_user)
         │
         ├── Run pregnancy_safety_service.evaluate(...) on food.ingredients
         │   with food_category + user.trimester    ← NEW
         │
         ├── Run check_allergens(food, user)        ← NEW
         │
         └── Return JSON shaped like FoodLogResponse, with food.safety_verdict
             and food.allergen_hits populated.
```

### 4.3 The `PATCH /food/log/{log_id}` flow (rewritten in this session)

The previous implementation called `setattr(log, field, value)` for each updated field and committed — meaning a user changing `serving_size` from 1 to 2 would keep the old `calories_logged` / `nutrients_logged` (stale).

New implementation:

```
update_food_log()
   │
   ├── Authorize: SELECT log WHERE id = log_id AND user_id = me AND deleted_at IS NULL
   │
   ├── SELECT food row referenced by the log
   │
   ├── Apply patch via setattr (unchanged)
   │
   ├── IF any of (serving_size, serving_unit, quantity) was patched:
   │     re-run NutritionCalculatorService.calculate_consumed_nutrition(...)
   │     overwrite log.calories_logged + log.nutrients_logged
   │
   ├── Bump log.updated_at
   ├── Commit, refresh
   │
   └── return _format_food_log_response(log, food, user=current_user)
```

Test expectation: PATCH `serving_size: 1 → 2` doubles `calories_logged`. The previous implementation kept the original value.

### 4.4 Daily / weekly aggregation (`DailyNutrition`)

`DailyNutrition.add_food(food, quantity)` was previously broken in two ways:

1. The `nutrient_map` keyed by human-readable strings (`"calcium, Ca"`, `"sodium, Na"`) — but the actually-stored keys come from `name.lower().replace(' ', '_')`, so the lookup never hit. Aggregation fell silently to zero for everything.
2. `sodium`, `calcium`, `iron` rows in the map applied a `1000` multiplier "to convert g to mg", but USDA already returns those in mg. When the lookup *did* coincidentally hit, the result was 1000× too high.

New implementation:

- Macros (`protein_g`, `carbs_g`, `fat_g`, `fiber_g`, `sugar_g`) are summed directly from the explicit `Food` columns, scaled by `quantity`.
- Micros are read from `Food.micronutrients` (the JSONB column) using a key map covering both the underscore-with-comma USDA storage form (`sodium,_na`) and the canonical short form (`sodium`). USDA returns each nutrient in its native unit (mg/mcg/g) and we no longer multiply by 1000.
- DHA / omega-3 caught by hint substring matching (`22:6`, `dha`, `n-3`, `omega-3`) since USDA encodes them as long polyunsaturated-fatty-acid names.
- New tracked fields: `magnesium_mg`, `zinc_mg`, `potassium_mg`, `choline_mg`, `dha_mg`, `omega3_mg`. The frontend already tracked `dha_mg` / `choline_mg` in `NutritionTargets` but the backend was silently dropping them.

The companion `/nutrition-summary` endpoint in `backend/app/api/food/nutrition.py` reads from `log.nutrients_logged` (already-scaled) and was extended in parallel.

### 4.5 Edit / delete UX (frontend)

Frontend `useFoodEntry.ts` had a bug where any unrecognized unit fell through to `gramsMultiplier = amount / 100` — so `"100 blurps"` would compute as 100g and be persisted. Now the hook returns `null` nutrition for unknown units and `isValid` rejects them, blocking the save button. Empty unit (`"100"`) still defaults to grams since that's the natural shorthand.

---

## 5. How pregnancy safety works (rewritten this session)

### 5.1 Rule store

`backend/app/data/pregnancy_safety_rules.json` is the canonical rule set. Schema:

```json
{
  "version": 2,
  "sources": {
    "fda_fish_2024": {
      "label": "FDA — Advice About Eating Fish (2024)",
      "url": "https://www.fda.gov/food/consumers/advice-about-eating-fish",
      "last_reviewed": "2024-03-15"
    },
    "cdc_listeria": { "...": "..." },
    "acog_nutrition": { "...": "..." },
    "nhs_foods_avoid": { "...": "..." },
    "who_food_safety": { "...": "..." },
    "internal_v1": { "...": "..." }
  },
  "categories": {
    "soft_cheese": { "default_status": "avoid", "default_source_id": "cdc_listeria", "default_notes": "..." },
    "high_mercury_fish": { "...": "..." },
    "deli_meat": { "...": "..." },
    "raw_animal_protein": { "...": "..." },
    "alcohol": { "...": "..." }
  },
  "rules": [
    {
      "pattern": "raw salmon",
      "pattern_type": "exact",
      "category": "raw_animal_protein",
      "status": "avoid",
      "severity_score": 0.95,
      "trimester": "all",
      "notes": "Avoid raw salmon — Listeria and parasite risk.",
      "source_id": "cdc_listeria"
    },
    {
      "pattern": "caffeine",
      "pattern_type": "exact",
      "status": "limited",
      "severity_score": 0.4,
      "trimester": "all",
      "notes": "ACOG: limit caffeine to under 200 mg per day during pregnancy.",
      "source_id": "acog_nutrition",
      "amount_limit": { "amount": 200, "unit": "mg", "period": "day" }
    },
    { "...": "..." }
  ]
}
```

200 rules in total (56 avoid / 37 limited / 107 safe). Trimester-specific rules supported (e.g., `liver` flagged `avoid` in T1 due to retinol toxicity, `limited` otherwise).

### 5.2 Layered matching pipeline

`PregnancySafetyService.evaluate(ingredients, food_category, trimester)` runs each ingredient through the layers below. Highest-confidence layer wins; ties prefer the most-conservative status. Per-ingredient confidence:

| Layer | Pattern | Confidence |
|---|---|---|
| **exact** | ingredient text equals rule pattern (case-insensitive) | 1.00 |
| **prefix** | rule has `pattern_type: "prefix"` and ingredient starts with `pattern` followed by a non-alnum (so `"deli meat"` matches `"deli meat sandwich"` but not `"delicious"`) | 0.92 |
| **token** | rule pattern appears as a whole-word token inside the ingredient text (`shark` inside `"shark steak"`, `cheddar` inside `"fresh cheddar"`). Word-boundary regex prevents `egg → eggplant`. | 0.85 |
| **category** | `food_category` (USDA `foodCategory` or our `Food.category`) maps to a category key — picks the highest-severity rule in that category, else synthesizes a category default | 0.80 |
| **fuzzy** | Jaccard token similarity between ingredient and any exact-pattern rule ≥ 0.7 | 0.70 |
| **default** | Nothing matched → `limited`, "Not yet reviewed against our rule set." | 0.20 |

Trimester-aware: rules with `trimester != "all"` only apply when the user's current trimester matches. When the user has no `due_date` set, trimester is treated as `"all"` (all rules apply).

### 5.3 The `SafetyVerdict` shape returned to clients

```python
{
  "status": "avoid",
  "confidence": 0.95,
  "summary": "Avoid during pregnancy due to: raw salmon, blue cheese",
  "ingredient_findings": [
    {
      "ingredient": "raw salmon",
      "status": "avoid",
      "notes": "Avoid raw salmon — Listeria and parasite risk.",
      "matched_pattern": "raw salmon",
      "matched_layer": "exact",
      "category": "raw_animal_protein",
      "source": {
        "id": "cdc_listeria",
        "label": "CDC — Listeria and Pregnancy",
        "url": "https://www.cdc.gov/listeria/prevention/pregnant-women.html",
        "last_reviewed": "2024-08-01"
      },
      "confidence": 1.0,
      "amount_limit": null
    },
    { "...": "..." }
  ],
  "cited_sources": [
    { "id": "cdc_listeria", "label": "CDC — Listeria and Pregnancy", "url": "...", "last_reviewed": "2024-08-01" }
  ],
  "trimester": "t2",
  "trimester_specific": false,
  "amount_guidance": null,
  "reviewed_by_human": true
}
```

`reviewed_by_human` is `true` for any curated rule hit. It's a placeholder for a future LLM-augmentation layer — when that ships, LLM-only verdicts will set it `false` and the UI will render an "AI-assisted estimate" banner.

### 5.4 Backward-compatibility shims

The legacy callers (`usda_service.analyze_food_safety`, `cache_manager.cache_spoonacular_results`, etc.) keep working unchanged. The shims map the new layered output back to the old tuple shapes:

- `get_safety_status(name) → {status, notes}`
- `check_ingredient_safety(name) → (status, notes)`
- `check_food_safety(ingredients) → (overall_status, summary, [{name, safety_status, safety_notes}, ...])`
- `get_safety_recommendations(status) → [str, ...]`

### 5.5 Where the verdict surfaces

| Endpoint | Field |
|---|---|
| `POST /food/log` | `food.safety_verdict`, `food.allergen_hits` |
| `GET /food/log` | per-row `food.safety_verdict`, `food.allergen_hits` |
| `GET /food/log/{id}` | `food.safety_verdict`, `food.allergen_hits` |
| `PATCH /food/log/{id}` | `food.safety_verdict`, `food.allergen_hits` |
| `POST /food/analyze-photo` (sync) | `food.safety_verdict`, `food.allergen_hits` |
| `GET /food/barcode/{code}` | `safety_verdict`, `allergen_hits` |

The verdict is computed on the fly from `Food.ingredients` (joined with AI-detected ingredients in the photo path) and the user's trimester. It is **not persisted on the `foods` table yet** — adding `safety_verdict JSONB` to the Food model is in the deferred plan.

---

## 6. How allergen check works (new this session)

`backend/app/services/allergen_service.py` exports a single function:

```python
check_allergens(food, user) -> List[AllergenHit]
```

Algorithm:

1. Normalize `User.allergies` (a free-text JSON list) onto canonical FDA Big-9 keys via alias matching.
2. For each canonical key:
   - **Layer 1 — explicit tag.** If any string in `Food.allergens` contains an alias of this canonical key, emit `{matched_in: "allergens", severity: "block"}`.
   - **Layer 2 — scan.** Otherwise, search `Food.name + Food.ingredients + Food.description` (lowercased haystack) for whole-word alias matches. Emit `{matched_in: "ingredients" | "name", severity: "warn"}`.

Severity drives UX: `block` triggers a confirmation modal before logging, `warn` only renders a badge. Frontend `AllergenBadge` reflects this — block shows red with "Confirm before logging", warn shows amber with "Verify ingredients on the label."

Canonical aliases (in `_CANONICAL_ALLERGENS`):

- `milk` → `dairy / lactose / casein / whey / cheese / butter / cream / yogurt`
- `tree_nuts` → `almond / cashew / walnut / pecan / pistachio / hazelnut / brazil nut / macadamia`
- `shellfish` → `shrimp / lobster / crab / clam / oyster / scallop / mussel`
- `wheat` → `wheat / gluten`
- `soy` → `soy / soya / edamame / tofu`
- `sesame` → `sesame / tahini`
- `peanut`, `egg`, `fish` → straight key match.

---

## 7. How barcode lookup works (new this session)

```
BarcodeScannerScreen → barcodeService.lookupBarcode(code)
        │
        ▼
foodAPI.lookupBarcode(code) ──► GET /food/barcode/{code}
        │
        ▼
lookup_barcode() in api/food/lookup.py
   │
   ├── _is_valid_barcode  (UPC/EAN: 8 / 12 / 13 / 14 digits, all numeric)
   │     no → 400
   │
   ├── SELECT foods WHERE off_id = code     ← cache-first
   │
   ├── miss → open_food_facts_service.get_by_barcode(code)
   │            └── 404 if OFF returns status:0
   │
   ├── food_factory.create_food_from_off(db, product)
   │     • dedupes on off_id (race-safe via IntegrityError re-query)
   │     • parses canonical micros + allergen tags
   │     • runs pregnancy_safety_service.evaluate() at ingest
   │     • tags source = open_food_facts
   │
   ├── pregnancy_safety_service.evaluate(food.ingredients, food.category, user.trimester)
   ├── allergen_service.check_allergens(food, user)
   │
   └── return { ...food fields, safety_verdict, allergen_hits, source: "open_food_facts" }
```

Why this is better than the old client-only flow:

1. **Cache shared across users.** First user's scan benefits everyone. The old in-memory `Map` died on every app restart.
2. **Real `Food` rows.** Logging a scanned product no longer creates orphan ad-hoc objects with `id: "barcode_<code>"`. The food gets a UUID and joins the rest of the catalog.
3. **Pregnancy + allergen pipeline runs.** Old path called `safetyAPI.checkFood(name)` separately and only got back a `safe/caution/avoid` string. Now full `SafetyVerdict` + per-user `allergen_hits` come back in one round-trip.
4. **OFF rate limit centralized.** Polite ≤1 req/sec is enforced server-side, not at every device.

---

## 8. Frontend pieces

### 8.1 `FoodSafetyBadge.tsx`

Now accepts an optional `verdict` prop (the full `SafetyVerdict` from the backend). When present, the modal renders five sections:

1. Status header with confidence percentage.
2. Summary line (uses `verdict.summary` if present, else falls back to legacy `notes`).
3. AI-assisted banner (only when `reviewed_by_human === false`).
4. **Why** — per-ingredient findings, each with a status pill and a tappable citation link (`Linking.openURL`).
5. **Sources** — bulleted list of authoritative URLs with `last_reviewed` dates.
6. Avoid-warning box (when status is `avoid`).
7. Centralized `<SafetyDisclaimer />` footer.

Backward compatible: callers who only pass `notes` get the original simple modal.

### 8.2 `SafetyDisclaimer.tsx` (new)

Single source of truth for "informational not medical advice" disclaimer text. Replaces the four scattered copies in `SafetyWarningModal.tsx`, `FloatingChatbot.tsx`, `TrimesterTrackerScreen.tsx`, and the inline text in `FoodSafetyBadge.tsx`. Has `compact` and full variants.

### 8.3 `AllergenBadge.tsx` (new)

Pure presentational. Takes `hits: AllergenHit[]`, renders nothing if empty, otherwise stacks a single row with:

- Severity-driven left-border color (red for block, amber for warn).
- Headline: single allergen label or `"N allergens"`.
- Detail: comma-separated allergen names + action copy ("Confirm before logging" vs. "Verify ingredients on the label").

Intended to render **above** the pregnancy `FoodSafetyBadge` in `ProductConfirmModal` and the dashboard food cards.

### 8.4 `useFoodEntry.ts`

Drops the silent `default: gramsMultiplier = amount / 100` fallback. Unknown unit → `null` nutrition. `isValid` now requires the unit to be empty or in the `SUPPORTED_UNITS` set (`g/mg/oz/cup/tbsp/tsp/ml/serving` and their long forms). Empty unit still treated as grams to match the `"100"` shorthand legacy users type.

### 8.5 `barcodeService.ts` (rewritten this session)

Simplified to a single backend hop. The previous implementation owned its own OFF axios client, an `OpenFoodFactsResponse` type, an in-memory `Map<string, BarcodeProduct>` cache with a `setTimeout`-driven 24h expiry, and a `transformToFoodItem` helper that called `safetyAPI.checkFood` separately. All of that is gone — now `lookupBarcode(code)` calls `foodAPI.lookupBarcode(code)` and maps the response into the existing `FoodItem` shape, threading through `safety_verdict` + `allergen_hits` + `ingredients` + `allergens`. Returns `null` on 404 / invalid format. `clearBarcodeCache()` retained as a no-op so existing call sites don't break. `isValidBarcodeFormat` unchanged (8/12/13/14 digit numeric).

---

## 9. Deferred (not in this session)

These are in the plan but did not ship yet:

- **Idempotency middleware** for `POST /food/log` (Redis-backed, 60s window).
- **`Food.safety_verdict JSONB` column** + Alembic migration so verdicts persist instead of being recomputed on every read.
- **`pregnancy_safety_rules` DB table** + admin curation UI (currently still file-based).
- **LLM augmentation layer** (Gemini structured-output verdict for novel ingredients, capped at 0.5 confidence, cached by ingredient hash).
- **Embedding / pgvector layer** for fuzzy match.
- **`POST /food/safety/report`** "Report incorrect classification" endpoint + `safety_reports` table + admin queue.
- **Sectioned ingredient breakdown in `ProductConfirmModal`** wiring the new `verdict` and `allergen_hits` fields.
- **Allergen flag onboarding flow** (`User.allergen_flags JSONB` migration + UI to capture canonical Big-9 flags rather than free-text strings).
- **Drop USDA `analyze_food_safety` keyword fallback** now that the layered pipeline subsumes it.
- **Canonical micronutrient keys at USDA ingest** in `food_factory.create_food_from_usda` (mirrors the OFF parser; right now USDA still stores raw nutrient names and the aggregation key map handles both forms).
- **Shadow-mode harness** (`USE_DB_SAFETY_RULES` flag) — only relevant once the DB rule table ships.

---

## 10. Verification

Inline smoke tests run during the session (no pytest available locally):

- 12/13 layered-matcher cases pass. Cases include: `raw salmon`, `Brie` (case insensitive), `fresh cheddar` (token layer), `shark steak` (token layer), `caffeine` (exact + amount limit), `liver` in T1 (avoid) vs T2 (limited fallback), `eggplant parmesan` (correctly NOT matching `egg` rule due to whole-word boundary), `soft cheese plate` matched via category. The single miss is `deli turkey sandwich` — pattern is `deli meat`, no token overlap; long-tail.
- 6/6 allergen cases pass — explicit tag, ingredient scan, no false positives on plain rice.
- Backward-compat shim coverage 4/4: `check_ingredient_safety`, `check_food_safety`, `get_safety_status`, `get_safety_recommendations` all return the old shapes.
- Pydantic round-trip OK: `SafetyVerdict(**pregnancy_safety_service.evaluate(...))` reconstructs cleanly with all citations.
- AST parse-check on all 11 changed Python files in the OFF integration: clean.

Manual checklist for the next interactive QA pass:

1. Search `"salmon"` — modal shows FDA citation, status `safe`. USDA + OFF results merged by score.
2. Search `"brie"` — `avoid`, citation = CDC Listeria.
3. Search a packaged product like `"oreo"` — both OFF (with `nutriscore_grade`, branded) and USDA results show up, exact name match wins.
4. Photo of an unknown food — verdict comes back, `reviewed_by_human` may flip to `false` once LLM layer ships.
5. Set user allergy = `"milk"`, log Greek yogurt — red allergen badge above pregnancy badge.
6. Edit existing log: change `1 cup → 2 cup` → calories double on save (regression for the stale-nutrition bug).
7. Try unit `"blurps"` in log create — backend returns `422`, frontend save button stays disabled.
8. Tap a citation chip in the safety modal — opens FDA / CDC / ACOG page in browser.
9. Scan a real packaged product → product details + safety verdict; row appears in `foods` table with `off_id` + `source = "open_food_facts"`.
10. Re-scan the same barcode → cache hit, no second OFF call (check `cache_expires_at`).
