# Automatic Changelog

## 2025-08-29 - Food Logging System Enhancements

### Added
- ✅ Trimester support with due_date field in User model (already existed)
- ✅ Dynamic trimester computation for food logs via `trimester_at_consumption` property
- ✅ Daily nutrient summary endpoint: GET /food/log/summary
- ✅ Weekly logging trend endpoint: GET /food/log/weekly-summary
- ✅ Soft delete functionality for FoodLog entries with `deleted_at` field
- ✅ Smart suggestions engine: GET /food/suggestions
- ✅ SmartSuggestionsService with trimester-specific nutrition targets
- ✅ Pregnancy-safe food recommendations based on nutritional gaps

### Modified
- ✅ FoodLog model: Added deleted_at field for soft deletes
- ✅ FoodLog model: Added trimester_at_consumption property
- ✅ Food logging queries: Updated to exclude soft-deleted entries across all endpoints
- ✅ Enhanced logging endpoints with comprehensive nutrition tracking

### New Features Details
- **Daily Summary**: Returns complete DailyNutrition object for any date
- **Weekly Summary**: 7-day nutrition trends with trimester context
- **Smart Suggestions**: AI-powered food recommendations based on:
  - Current nutrition intake vs trimester targets
  - Identified nutritional gaps (protein, calcium, iron, folate, fiber)
  - Pregnancy-safe food database
  - Trimester-specific advice
- **Soft Delete**: Non-destructive deletion preserving data integrity

### Technical Details
- All changes maintain backward compatibility
- Existing API endpoints unchanged
- Database migration required for `deleted_at` field in food_logs table
- Enhanced nutrition analysis with trimester-aware calculations
- Comprehensive error handling and logging

---
