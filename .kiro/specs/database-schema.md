# Aurea Pregnancy Nutrition App - Complete Database Schema

## Overview

This document defines the complete Supabase/PostgreSQL database schema for the Aurea Pregnancy Nutrition App, including tables for all three development tracks (Person 1: AI Features, Person 2: Pregnancy Tracking, Person 3: UX Features).

## Database Diagram

```
users (core)
  ├── food_logs (existing)
  ├── journal_entries (Person 3)
  ├── chat_sessions (Person 1)
  ├── meal_photos (Person 1)
  ├── meal_suggestions (Person 1)
  ├── grocery_lists (Person 1)
  ├── notification_preferences (Person 3)
  ├── pregnancy_tracking (Person 2)
  └── nutrient_goals (Person 2)

foods (existing)
  └── food_logs (existing)
```

---

## Core Tables (Existing)

### 1. users

**Purpose:** Store user account and profile information

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    due_date DATE NOT NULL,
    babies INTEGER DEFAULT 1,
    pre_pregnancy_weight FLOAT,
    height FLOAT,
    current_weight FLOAT,
    blood_type VARCHAR(10),
    allergies JSONB DEFAULT '[]',
    conditions JSONB DEFAULT '[]',
    dietary_preferences VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_due_date ON users(due_date);
```

**Key Fields:**
- `due_date`: Used to calculate pregnancy week and trimester
- `allergies`: Array of allergen strings (e.g., ["peanuts", "dairy"])
- `conditions`: Array of health conditions (e.g., ["gestational_diabetes", "anemia"])
- `dietary_preferences`: e.g., "vegetarian", "vegan", "gluten_free"

---

### 2. foods

**Purpose:** Store food items with nutrition data

```sql
CREATE TYPE food_safety_status AS ENUM ('safe', 'limited', 'avoid');
CREATE TYPE food_source AS ENUM ('spoonacular', 'usda', 'manual', 'gemini');

CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    brand VARCHAR(100),
    serving_size FLOAT NOT NULL,
    serving_unit VARCHAR(20) NOT NULL,
    calories FLOAT NOT NULL DEFAULT 0,
    protein FLOAT NOT NULL DEFAULT 0,
    carbs FLOAT NOT NULL DEFAULT 0,
    fat FLOAT NOT NULL DEFAULT 0,
    fiber FLOAT,
    sugar FLOAT,
    micronutrients JSONB DEFAULT '{}',
    ingredients TEXT[],
    allergens TEXT[],
    spoonacular_id BIGINT,
    fdc_id BIGINT,
    safety_status food_safety_status DEFAULT 'safe',
    safety_notes TEXT,
    usda_confidence FLOAT,
    source food_source DEFAULT 'manual',
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(name, brand, serving_size, serving_unit)
);

CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_category ON foods(category);
CREATE INDEX idx_foods_brand ON foods(brand);
CREATE INDEX idx_foods_spoonacular_id ON foods(spoonacular_id);
CREATE INDEX idx_foods_fdc_id ON foods(fdc_id);
```

**micronutrients JSONB structure:**
```json
{
  "folate": {"amount": 400, "unit": "mcg", "percent_daily_needs": 100},
  "iron": {"amount": 27, "unit": "mg", "percent_daily_needs": 150},
  "calcium": {"amount": 1000, "unit": "mg", "percent_daily_needs": 100},
  "vitamin_d": {"amount": 600, "unit": "IU", "percent_daily_needs": 100},
  "dha": {"amount": 200, "unit": "mg"},
  "choline": {"amount": 450, "unit": "mg"}
}
```

---

### 3. food_logs

**Purpose:** Track user's daily food consumption

```sql
CREATE TABLE food_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    serving_size FLOAT NOT NULL,
    serving_unit VARCHAR(20) NOT NULL,
    quantity FLOAT NOT NULL,
    consumed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    meal_type VARCHAR(20),  -- 'breakfast', 'lunch', 'dinner', 'snack'
    notes TEXT,
    deleted_at TIMESTAMP,
    calories_logged FLOAT NOT NULL DEFAULT 0,
    nutrients_logged JSONB,
    meal_photo_id UUID REFERENCES meal_photos(id),  -- NEW: Link to photo
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_food_logs_user_id ON food_logs(user_id);
CREATE INDEX idx_food_logs_consumed_at ON food_logs(consumed_at);
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, consumed_at);
CREATE INDEX idx_food_logs_meal_type ON food_logs(meal_type);
```

---

## Person 3: UX Features Tables

### 4. journal_entries

**Purpose:** Store user's daily journal entries with symptoms, mood, and wellness tracking

```sql
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL,
    symptoms TEXT[],  -- ['nausea', 'fatigue', 'headache', 'back_pain']
    mood INTEGER CHECK (mood >= 1 AND mood <= 5),
    cravings TEXT,
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 5),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, entry_date)
);

CREATE INDEX idx_journal_user_date ON journal_entries(user_id, entry_date DESC);
```

---

### 5. notification_preferences

**Purpose:** Store user's notification settings

```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    notifications_enabled BOOLEAN DEFAULT true,
    hydration_enabled BOOLEAN DEFAULT true,
    hydration_interval INTEGER DEFAULT 2,  -- hours
    supplement_enabled BOOLEAN DEFAULT true,
    supplement_time TIME DEFAULT '08:00:00',
    supplement_name VARCHAR(100) DEFAULT 'Prenatal Vitamin',
    meal_reminders_enabled BOOLEAN DEFAULT true,
    breakfast_time TIME DEFAULT '08:00:00',
    lunch_time TIME TIME DEFAULT '12:00:00',
    dinner_time TIME DEFAULT '18:00:00',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_prefs_user ON notification_preferences(user_id);
```

---

## Person 1: AI Features Tables

### 6. meal_photos

**Purpose:** Store meal photos uploaded for AI analysis

```sql
CREATE TABLE meal_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_url TEXT NOT NULL,  -- Supabase Storage URL
    thumbnail_url TEXT,
    file_size INTEGER,  -- bytes
    mime_type VARCHAR(50),
    analysis_status VARCHAR(20) DEFAULT 'pending',  -- 'pending', 'analyzing', 'completed', 'failed'
    analysis_result JSONB,  -- Gemini Vision response
    confidence_score FLOAT,
    uploaded_at TIMESTAMP DEFAULT NOW(),
    analyzed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_meal_photos_user ON meal_photos(user_id);
CREATE INDEX idx_meal_photos_uploaded ON meal_photos(uploaded_at DESC);
CREATE INDEX idx_meal_photos_status ON meal_photos(analysis_status);
```

**analysis_result JSONB structure:**
```json
{
  "detected_foods": [
    {
      "name": "Grilled Chicken Breast",
      "quantity": 6,
      "unit": "oz",
      "confidence": 0.92
    },
    {
      "name": "Steamed Broccoli",
      "quantity": 1,
      "unit": "cup",
      "confidence": 0.88
    }
  ],
  "meal_type_suggestion": "lunch",
  "raw_response": "..."
}
```

---

### 7. chat_sessions

**Purpose:** Store AI chat conversations for food safety Q&A

```sql
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),  -- Auto-generated from first message
    pregnancy_week INTEGER,  -- Week at time of chat creation
    trimester INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_created ON chat_sessions(created_at DESC);
```

---

### 8. chat_messages

**Purpose:** Store individual messages within chat sessions

```sql
CREATE TYPE message_role AS ENUM ('user', 'assistant', 'system');

CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,  -- Store additional context like safety_status, sources
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_chat_messages_session ON chat_messages(session_id, created_at);
```

**metadata JSONB structure:**
```json
{
  "safety_status": "caution",
  "food_mentioned": "brie cheese",
  "sources": ["CDC", "ACOG"],
  "confidence": 0.95
}
```

---

### 9. meal_suggestions

**Purpose:** Store AI-generated meal suggestions

```sql
CREATE TABLE meal_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    suggestion_date DATE NOT NULL,
    nutrient_gaps JSONB NOT NULL,  -- What nutrients are deficient
    suggestions JSONB NOT NULL,  -- Array of meal suggestions
    pregnancy_week INTEGER,
    dietary_preferences VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP DEFAULT NOW() + INTERVAL '24 hours'
);

CREATE INDEX idx_meal_suggestions_user_date ON meal_suggestions(user_id, suggestion_date DESC);
CREATE INDEX idx_meal_suggestions_expires ON meal_suggestions(expires_at);
```

**nutrient_gaps JSONB:**
```json
{
  "iron": {"current": 15, "target": 27, "deficit": 12, "unit": "mg"},
  "folate": {"current": 300, "target": 600, "deficit": 300, "unit": "mcg"}
}
```

**suggestions JSONB:**
```json
[
  {
    "meal_name": "Spinach and Lentil Salad",
    "meal_type": "lunch",
    "nutrients_provided": {
      "iron": 8,
      "folate": 200
    },
    "recipe": "...",
    "ingredients": ["spinach", "lentils", "tomatoes"]
  }
]
```

---

### 10. grocery_lists

**Purpose:** Store user's grocery lists generated from meal suggestions

```sql
CREATE TABLE grocery_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    items JSONB NOT NULL,  -- Array of grocery items
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_grocery_lists_user ON grocery_lists(user_id);
CREATE INDEX idx_grocery_lists_created ON grocery_lists(created_at DESC);
```

**items JSONB:**
```json
[
  {
    "name": "Spinach",
    "category": "produce",
    "quantity": "2 bunches",
    "checked": false
  },
  {
    "name": "Lentils",
    "category": "grains",
    "quantity": "1 lb",
    "checked": true
  }
]
```

---

### 11. ai_cache

**Purpose:** Cache AI responses to reduce API costs and improve performance

```sql
CREATE TABLE ai_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key VARCHAR(255) UNIQUE NOT NULL,  -- Hash of prompt + context
    prompt_type VARCHAR(50) NOT NULL,  -- 'food_safety', 'meal_suggestion', 'photo_analysis'
    request_data JSONB NOT NULL,
    response_data JSONB NOT NULL,
    hit_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    last_accessed_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX idx_ai_cache_type ON ai_cache(prompt_type);
```

---

## Person 2: Pregnancy Tracking Tables

### 12. pregnancy_tracking

**Purpose:** Track weekly pregnancy progress and health flags

```sql
CREATE TABLE pregnancy_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    current_week INTEGER NOT NULL,
    current_trimester INTEGER NOT NULL,
    conception_date DATE,
    last_period_date DATE,
    health_flags JSONB DEFAULT '[]',  -- ['gestational_diabetes', 'anemia', 'nausea']
    weight_history JSONB DEFAULT '[]',  -- Array of {date, weight} objects
    blood_pressure_history JSONB DEFAULT '[]',
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pregnancy_tracking_user ON pregnancy_tracking(user_id);
```

**health_flags JSONB:**
```json
[
  {
    "flag": "gestational_diabetes",
    "diagnosed_date": "2024-11-01",
    "severity": "moderate",
    "notes": "Monitoring blood sugar"
  }
]
```

---

### 13. nutrient_goals

**Purpose:** Store personalized daily nutrient targets based on pregnancy week

```sql
CREATE TABLE nutrient_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pregnancy_week INTEGER NOT NULL,
    calories_target FLOAT NOT NULL,
    protein_target FLOAT NOT NULL,
    carbs_target FLOAT NOT NULL,
    fat_target FLOAT NOT NULL,
    micronutrient_targets JSONB NOT NULL,  -- Detailed micronutrient goals
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, pregnancy_week)
);

CREATE INDEX idx_nutrient_goals_user_week ON nutrient_goals(user_id, pregnancy_week);
```

**micronutrient_targets JSONB:**
```json
{
  "folate": {"target": 600, "unit": "mcg", "importance": "critical"},
  "iron": {"target": 27, "unit": "mg", "importance": "critical"},
  "calcium": {"target": 1000, "unit": "mg", "importance": "high"},
  "dha": {"target": 200, "unit": "mg", "importance": "high"},
  "choline": {"target": 450, "unit": "mg", "importance": "high"},
  "vitamin_d": {"target": 600, "unit": "IU", "importance": "high"}
}
```

---

### 14. weekly_insights

**Purpose:** Store automated weekly insights and recommendations

```sql
CREATE TABLE weekly_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pregnancy_week INTEGER NOT NULL,
    insight_type VARCHAR(50) NOT NULL,  -- 'nutrition', 'symptom', 'milestone'
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    data JSONB,  -- Supporting data for the insight
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, pregnancy_week, insight_type)
);

CREATE INDEX idx_weekly_insights_user_week ON weekly_insights(user_id, pregnancy_week DESC);
```

---

## Utility Tables

### 15. api_usage_logs

**Purpose:** Track API usage for monitoring and billing

```sql
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    api_name VARCHAR(50) NOT NULL,  -- 'gemini_vision', 'gemini_pro', 'spoonacular'
    endpoint VARCHAR(255),
    tokens_used INTEGER,
    cost_estimate DECIMAL(10, 4),
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_api_usage_user ON api_usage_logs(user_id);
CREATE INDEX idx_api_usage_created ON api_usage_logs(created_at DESC);
CREATE INDEX idx_api_usage_api_name ON api_usage_logs(api_name);
```

---

## Database Functions and Triggers

### Auto-update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_logs_updated_at BEFORE UPDATE ON food_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ... (apply to all relevant tables)
```

### Calculate pregnancy week function

```sql
CREATE OR REPLACE FUNCTION calculate_pregnancy_week(due_date DATE)
RETURNS INTEGER AS $$
DECLARE
    conception_date DATE;
    days_pregnant INTEGER;
    weeks_pregnant INTEGER;
BEGIN
    conception_date := due_date - INTERVAL '280 days';
    days_pregnant := CURRENT_DATE - conception_date;
    weeks_pregnant := days_pregnant / 7;
    RETURN GREATEST(1, LEAST(weeks_pregnant, 42));
END;
$$ LANGUAGE plpgsql;
```

---

## Row Level Security (RLS) Policies

Enable RLS for all user-specific tables:

```sql
-- Enable RLS
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE grocery_lists ENABLE ROW LEVEL SECURITY;

-- Example policy for food_logs
CREATE POLICY "Users can view their own food logs"
    ON food_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own food logs"
    ON food_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own food logs"
    ON food_logs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own food logs"
    ON food_logs FOR DELETE
    USING (auth.uid() = user_id);

-- Repeat similar policies for other tables
```

---

## Storage Buckets (Supabase Storage)

### meal-photos bucket
- **Purpose:** Store meal photos uploaded by users
- **Access:** Private (user can only access their own photos)
- **Max file size:** 10MB
- **Allowed types:** image/jpeg, image/png, image/heic

---

## Summary

**Total Tables:** 15
- **Core/Existing:** 3 (users, foods, food_logs)
- **Person 1 (AI):** 6 (meal_photos, chat_sessions, chat_messages, meal_suggestions, grocery_lists, ai_cache)
- **Person 2 (Tracking):** 3 (pregnancy_tracking, nutrient_goals, weekly_insights)
- **Person 3 (UX):** 2 (journal_entries, notification_preferences)
- **Utility:** 1 (api_usage_logs)

This schema supports all planned features while maintaining data integrity, performance, and security through proper indexing, constraints, and RLS policies.
