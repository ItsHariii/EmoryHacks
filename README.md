# Ovi - Pregnancy Nutrition & Wellness Platform

A comprehensive mobile and web platform for pregnancy nutrition tracking, food safety analysis, and wellness monitoring.

## 🌟 Overview

Ovi helps expecting mothers track their nutrition, monitor wellness, and make informed food choices during pregnancy. The platform combines a React Native mobile app with a FastAPI backend to provide real-time nutrition tracking, food safety recommendations, and personalized wellness insights.

## 🏗️ Architecture

```
ovi/
├── ovi-frontend/      # React Native mobile app (Expo)
├── backend/             # FastAPI Python backend
├── frontend/            # Alternative frontend (if applicable)
└── .kiro/              # Kiro IDE specifications
```

## 📱 Features

### Mobile App (ovi-frontend)
- **Food Logging**: Track meals with detailed nutrition information
  - Search from 500,000+ foods (USDA + Spoonacular)
  - Barcode scanner for quick entry
  - Custom serving sizes and units
  - Automatic nutrition calculation
- **Comprehensive Nutrition Tracking**: 
  - **65+ nutrients tracked** including all pregnancy-critical micronutrients
  - Macronutrients: protein, carbs, fat, fiber, sugar
  - Micronutrients: calcium, iron, folate, vitamins A/C/D/E/K, B-vitamins, zinc, magnesium, potassium, and more
  - Trimester-specific recommendations
- **Barcode Scanner**: Quick food entry via barcode scanning
- **Journal & Mood Tracking**: Daily wellness journal with symptoms and mood
- **Push Notifications**: Smart reminders for hydration, supplements, and meals
- **Nutrition Dashboard**: Visual progress tracking for daily goals
- **Food Safety**: Pregnancy-specific food safety recommendations

### Backend API
- **User Authentication**: Secure JWT-based authentication
- **Food Database**: Integration with Spoonacular and USDA FoodData Central
  - 500,000+ foods with complete nutrition data
  - Automatic caching for performance
  - Support for branded and raw foods
- **Nutrition Analysis**: Real-time nutrition calculations
  - Automatic scaling based on serving sizes
  - Support for multiple serving units (g, ml, cups, oz, etc.)
  - Comprehensive micronutrient tracking
- **Journal API**: CRUD operations for wellness tracking
- **Food Safety**: Pregnancy-safe food recommendations
- **Health Monitoring**: Built-in health checks and metrics

## 📚 Documentation

- **[Quick Start Guide](QUICK_START.md)** - Get running in 5 minutes
- **[Complete Setup Guide](SETUP.md)** - Detailed setup instructions
- **[Backend Documentation](backend/README.md)** - API and backend details
- **[Frontend Documentation](ovi-frontend/README.md)** - Mobile app details
- **[Contributing Guide](CONTRIBUTING.md)** - How to contribute

## 🚀 Quick Start

### Prerequisites

- **Backend:**
  - Python 3.9+
  - PostgreSQL 13+ (or SQLite for development)
  - pip for package management

- **Frontend:**
  - Node.js 16+
  - npm or yarn
  - Expo CLI (installed globally: `npm install -g expo-cli`)

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration (see backend/README.md for details)

# Run database migrations
alembic upgrade head

# Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: `http://localhost:8000`
- **Interactive Docs**: `http://localhost:8000/docs`
- **Alternative Docs**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

### Frontend Setup

```bash
# Navigate to frontend directory
cd ovi-frontend

# Install dependencies
npm install

# Start the development server
npm start

# Run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web Browser
```

**Note**: Make sure the backend is running before starting the frontend.

For detailed setup instructions, see:
- [Backend README](backend/README.md)
- [Frontend README](ovi-frontend/README.md)

## 📚 Documentation

### Backend API

The backend provides a RESTful API with the following main endpoints:

- **Authentication**: `/auth/*`
  - POST `/auth/register` - User registration
  - POST `/auth/login` - User login
  - POST `/auth/logout` - User logout

- **Food**: `/food/*`
  - GET `/food/search` - Search food database
  - GET `/food/{food_id}` - Get food details
  - POST `/food/log` - Log food entry
  - GET `/food/entries` - Get food entries
  - POST `/food/safety-check` - Check food safety

- **Journal**: `/journal/*`
  - POST `/journal/entries` - Create journal entry
  - GET `/journal/entries` - Get journal entries
  - GET `/journal/entries/{entry_id}` - Get specific entry
  - PUT `/journal/entries/{entry_id}` - Update entry
  - DELETE `/journal/entries/{entry_id}` - Delete entry

- **Health**: `/health`
  - GET `/health` - Health check endpoint

Full API documentation available at `/docs` when running the backend.

### Frontend Structure

```
ovi-frontend/
├── app/
│   ├── components/       # Reusable UI components
│   │   ├── MoodSelector.tsx
│   │   ├── ProgressBar.tsx
│   │   └── SymptomPicker.tsx
│   ├── contexts/         # React contexts
│   │   └── AuthContext.tsx
│   ├── hooks/            # Custom hooks
│   │   ├── useBarcodeScanner.ts
│   │   └── useNotifications.ts
│   ├── screens/          # Screen components
│   │   ├── DashboardScreen.tsx
│   │   ├── FoodLoggingScreen.tsx
│   │   ├── JournalScreen.tsx
│   │   └── NotificationSettingsScreen.tsx
│   ├── services/         # API services
│   │   ├── api.ts
│   │   ├── barcodeService.ts
│   │   └── notificationService.ts
│   ├── types/            # TypeScript types
│   └── theme.ts          # Theme configuration
└── App.tsx               # Root component
```

## 🔧 Configuration

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/ovi_db

# Security
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys
SPOONACULAR_API_KEY=your-spoonacular-key
USDA_API_KEY=your-usda-key

# Environment
ENVIRONMENT=development
DEBUG=True
```

### Frontend Configuration

The frontend uses the backend API URL configured in the code. Update `ovi-frontend/app/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000'; // Update for production
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
pytest
pytest --cov=app tests/  # With coverage
```

### Frontend Tests

```bash
cd ovi-frontend
npm test
```

## 📦 Deployment

### Backend Deployment

The backend can be deployed to various platforms:

**Docker:**
```bash
cd backend
docker build -t ovi-backend .
docker run -p 8000:8000 ovi-backend
```

**Heroku, AWS, or similar:**
- Set environment variables
- Run database migrations
- Start with `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend Deployment

**Expo Build:**
```bash
cd ovi-frontend
expo build:ios     # iOS
expo build:android # Android
```

**Web Deployment:**
```bash
npm run web
# Deploy the web-build/ directory to your hosting service
```

## 🛠️ Development

### Code Style

**Backend:**
- Black for formatting
- isort for import sorting
- mypy for type checking
- flake8 for linting

```bash
cd backend
black .
isort .
mypy app/
flake8 app/
```

**Frontend:**
- TypeScript for type safety
- ESLint for linting
- Prettier for formatting (if configured)

### Git Workflow

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Create a pull request

## 📊 Database Schema

The application uses PostgreSQL with the following main tables:

- **users**: User accounts and profiles
- **food_items**: Food database
- **food_entries**: User food logs
- **journal_entries**: Wellness journal entries

See `backend/app/models/` for detailed schema definitions.

## 🔐 Security

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 👥 Team & Support

For questions or support:
- Email: support@ovi.app
- Documentation: See individual README files in each directory

## 🗺️ Roadmap

- [ ] AI-powered meal recommendations
- [ ] Integration with fitness trackers
- [ ] Meal planning features
- [ ] Community features
- [ ] Healthcare provider portal
- [ ] Multi-language support

## 🙏 Acknowledgments

- Spoonacular API for food data
- USDA FoodData Central for nutrition information
- Expo team for the amazing framework
- FastAPI team for the excellent backend framework
