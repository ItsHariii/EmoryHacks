# Ovi - Pregnancy Nutrition & Wellness Platform

## Overview
Ovi is a comprehensive mobile and web platform designed to help expecting mothers track nutrition, monitor wellness, and make informed food choices during pregnancy. The platform combines a React Native mobile app with a FastAPI backend to deliver real-time nutrition tracking, food safety recommendations, and personalized wellness insights.

## Core Technology Stack
- **Frontend**: React Native (Expo) with TypeScript
- **Backend**: FastAPI (Python 3.9+)
- **Database**: PostgreSQL (SQLite for development)
- **Authentication**: JWT token-based security
- **External APIs**: USDA FoodData Central, Spoonacular

## Key Features

### 🍎 Comprehensive Nutrition Tracking
- **65+ nutrients tracked** including all pregnancy-critical micronutrients (calcium, iron, folate, vitamins A/C/D/E/K, B-vitamins, zinc, magnesium, potassium)
- Access to **500,000+ foods** from USDA and Spoonacular databases
- Automatic nutrition calculation with custom serving sizes and units
- Trimester-specific recommendations
- Daily and weekly nutrition summaries with visual progress tracking

### 📱 Smart Food Logging
- Barcode scanner for instant food entry
- Advanced search across multiple food databases
- Automatic caching for improved performance
- Support for branded and raw foods
- Meal type categorization (breakfast, lunch, dinner, snacks)

### 🛡️ Food Safety Intelligence
- Pregnancy-specific food safety recommendations
- Real-time safety checks with status indicators (safe, limited, avoid)
- Ingredient analysis and detailed safety notes
- Evidence-based guidance for expecting mothers

### 📔 Wellness & Mood Tracking
- Daily journal entries with mood tracking
- Symptom logging (nausea, fatigue, cravings, energy levels)
- Sleep quality monitoring
- Personal notes and observations

### 🔔 Smart Notifications
- Configurable hydration reminders (1-4 hour intervals)
- Daily supplement reminders at specific times
- Meal logging reminders for breakfast, lunch, and dinner
- Customizable notification preferences

### 🎨 Enhanced User Experience
- Smooth Lottie animations
- Professional skeleton loading states
- Helpful empty states with guidance
- Non-intrusive toast notifications
- Responsive design for all screen sizes

## Architecture

```
ovi/
├── ovi-frontend/      # React Native mobile app (Expo)
│   ├── app/
│   │   ├── components/    # Reusable UI components
│   │   ├── screens/       # Screen components
│   │   ├── services/      # API integration
│   │   ├── hooks/         # Custom React hooks
│   │   └── contexts/      # State management
│   └── assets/            # Images, animations
│
├── backend/           # FastAPI Python backend
│   ├── app/
│   │   ├── api/          # REST API endpoints
│   │   ├── models/       # Database models
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── core/         # Configuration & security
│   └── migrations/       # Alembic database migrations
│
└── .kiro/            # Development specifications
```

## API Endpoints
- **Authentication**: `/auth/*` - Register, login, logout, user profile
- **Food Management**: `/food/*` - Search, log, retrieve, update, delete food entries
- **Nutrition**: `/food/log/summary` - Daily and weekly nutrition summaries
- **Food Safety**: `/food/safety-check` - Pregnancy safety analysis
- **Journal**: `/journal/*` - CRUD operations for wellness entries
- **Health**: `/health` - System health checks

## Quick Start

### Backend (2 minutes)
```bash
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure DATABASE_URL, SECRET_KEY, API keys
alembic upgrade head
uvicorn app.main:app --reload
```
✅ Backend: http://localhost:8000 | Docs: http://localhost:8000/docs

### Frontend (2 minutes)
```bash
cd ovi-frontend
npm install
npm start  # Then press 'i' (iOS), 'a' (Android), or 'w' (Web)
```

## Security Features
- JWT token-based authentication with secure storage
- Password hashing with bcrypt
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic
- CORS protection
- Rate limiting support

## Development Roadmap
- AI-powered meal recommendations
- Integration with fitness trackers
- Meal planning features
- Community features
- Healthcare provider portal
- Multi-language support

## Documentation
- **Quick Start**: `QUICK_START.md` - Get running in 5 minutes
- **Setup Guide**: `SETUP.md` - Detailed installation instructions
- **Backend Docs**: `backend/README.md` - API and backend details
- **Frontend Docs**: `ovi-frontend/README.md` - Mobile app details
- **Contributing**: `CONTRIBUTING.md` - Development guidelines

## Support & Contact
- **API Documentation**: http://localhost:8000/docs (when running)
- **Email**: support@ovi.app
- **License**: MIT

---

**Ovi empowers expecting mothers with the tools and insights they need for a healthy pregnancy journey.**
