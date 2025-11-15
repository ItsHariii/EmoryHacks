# Design Document - Person 1: AI & Intelligence Features

## Overview

This design document outlines the technical architecture for AI-powered features in the Aurea Pregnancy Nutrition App. The implementation leverages Google's Gemini API (Vision and Pro models) to provide intelligent food analysis, conversational safety guidance, and personalized nutrition recommendations. The design emphasizes security, performance optimization through caching, and seamless integration with existing backend and frontend systems.

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native Frontend                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Photo Upload │  │  Chat UI     │  │ Meal Suggest │      │
│  │   Screen     │  │   Screen     │  │   Screen     │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
└─────────┼──────────────────┼──────────────────┼─────────────┘
          │                  │                  │
          │ HTTPS/REST API   │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              AI Service Layer                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │  Gemini    │  │  Gemini    │  │   Cache    │    │   │
│  │  │  Vision    │  │    Pro     │  │  Manager   │    │   │
│  │  │  Client    │  │   Client   │  │            │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Endpoints                           │   │
│  │  /ai/analyze-photo  /ai/chat  /ai/meal-suggestions  │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────┬────────────────────────────┬──────────────────────┘
          │                            │
          ▼                            ▼
┌──────────────────┐        ┌──────────────────┐
│  Supabase        │        │  Google Gemini   │
│  Storage         │        │  API             │
│  (Photos)        │        │  (Vision + Pro)  │
└──────────────────┘        └──────────────────┘
```

### Component Structure

```
backend/
├── app/
│   ├── services/
│   │   ├── gemini_service.py (NEW)
│   │   ├── photo_analysis_service.py (NEW)
│   │   ├── chat_service.py (NEW)
│   │   ├── meal_suggestion_service.py (NEW)
│   │   └── cache_service.py (NEW)
│   ├── api/
│   │   └── ai.py (NEW)
│   ├── models/
│   │   ├── chat_session.py (NEW)
│   │   ├── meal_photo.py (NEW)
│   │   └── ai_cache.py (NEW)
│   ├── schemas/
│   │   └── ai.py (NEW)
│   └── core/
│       └── prompts.py (NEW)

aurea-frontend/
├── app/
│   ├── screens/
│   │   ├── PhotoFoodLoggingScreen.tsx (NEW)
│   │   ├── AIChatScreen.tsx (NEW)
│   │   ├── MealSuggestionsScreen.tsx (NEW)
│   │   └── GroceryListScreen.tsx (NEW)
│   ├── components/
│   │   ├── PhotoAnalysisResult.tsx (NEW)
│   │   ├── ChatMessage.tsx (NEW)
│   │   ├── MealSuggestionCard.tsx (NEW)
│   │   └── FoodItemEditor.tsx (NEW)
│   └── services/
│       └── aiAPI.ts (NEW)
```

## Components and Interfaces

### 1. Gemini API Integration

#### Backend Service: gemini_service.py

Core service for interacting with Google Gemini API.
