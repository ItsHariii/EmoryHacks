# Aurea - Complete Setup Guide

This guide will help you set up the Aurea pregnancy nutrition platform from scratch.

## 📋 Table of Contents

1. [System Requirements](#system-requirements)
2. [Backend Setup](#backend-setup)
3. [Frontend Setup](#frontend-setup)
4. [Database Setup](#database-setup)
5. [API Keys](#api-keys)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

## System Requirements

### Backend
- **Python**: 3.9 or higher
- **Database**: PostgreSQL 13+ (recommended) or SQLite (development only)
- **OS**: macOS, Linux, or Windows with WSL

### Frontend
- **Node.js**: 16.x or higher
- **npm**: 7.x or higher (comes with Node.js)
- **Expo CLI**: Latest version
- **OS**: macOS (for iOS development), Windows/Linux (for Android/Web)

### Development Tools (Optional but Recommended)
- **VS Code** or **PyCharm** for backend
- **VS Code** with React Native extensions for frontend
- **Postman** or **Insomnia** for API testing
- **pgAdmin** or **TablePlus** for database management

## Backend Setup

### 1. Install Python Dependencies

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit .env file with your settings
nano .env  # or use your preferred editor
```

Required environment variables:
```env
# Database (use PostgreSQL for production)
DATABASE_URL=postgresql://username:password@localhost:5432/aurea_db

# Security (generate a secure random key)
SECRET_KEY=your-very-long-secret-key-at-least-32-characters
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# API Keys (optional but recommended)
SPOONACULAR_API_KEY=your-spoonacular-api-key
USDA_API_KEY=your-usda-api-key

# Environment
ENVIRONMENT=development
DEBUG=True
```

### 3. Set Up Database

**Option A: PostgreSQL (Recommended)**

```bash
# Install PostgreSQL (if not already installed)
# macOS:
brew install postgresql@15
brew services start postgresql@15

# Linux:
sudo apt-get install postgresql postgresql-contrib

# Windows:
# Download from https://www.postgresql.org/download/windows/

# Create database
createdb aurea_db

# Or using psql:
psql postgres
CREATE DATABASE aurea_db;
\q
```

**Option B: SQLite (Development Only)**

```env
# In .env file:
DATABASE_URL=sqlite:///./aurea.db
```

### 4. Run Database Migrations

```bash
# Make sure you're in the backend directory with venv activated
alembic upgrade head
```

### 5. Start Backend Server

```bash
# Development mode with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# The server will start at http://localhost:8000
```

### 6. Verify Backend

Open your browser and visit:
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

You should see the interactive API documentation and a healthy status.

## Frontend Setup

### 1. Install Node.js Dependencies

```bash
# Navigate to frontend directory
cd aurea-frontend

# Install dependencies
npm install

# Install Expo CLI globally (if not already installed)
npm install -g expo-cli
```

### 2. Configure API Connection

The frontend is pre-configured to connect to `http://localhost:8000`. If your backend runs on a different URL, update:

```typescript
// aurea-frontend/app/services/api.ts
const API_BASE_URL = 'http://localhost:8000'; // Change if needed
```

### 3. Start Frontend Development Server

```bash
# Start Expo development server
npm start

# Or use specific commands:
npm run ios      # iOS Simulator (macOS only)
npm run android  # Android Emulator
npm run web      # Web Browser
```

### 4. Run on Device/Simulator

**iOS (macOS only):**
```bash
npm run ios
```

**Android:**
```bash
# Make sure Android Studio and emulator are installed
npm run android
```

**Web:**
```bash
npm run web
```

**Physical Device:**
1. Install Expo Go app from App Store/Play Store
2. Scan the QR code shown in terminal
3. App will load on your device

## Database Setup

### Initial Data (Optional)

You can populate the database with sample data:

```bash
# From backend directory with venv activated
python scripts/seed_database.py  # If available
```

### Database Management

**View tables:**
```bash
psql aurea_db
\dt  # List tables
\d users  # Describe users table
```

**Backup database:**
```bash
pg_dump aurea_db > backup.sql
```

**Restore database:**
```bash
psql aurea_db < backup.sql
```

## API Keys

### USDA FoodData Central API Key

1. Visit: https://fdc.nal.usda.gov/api-key-signup.html
2. Sign up for a free API key
3. Add to `.env`: `USDA_API_KEY=your-key-here`

**Benefits:**
- Access to 500,000+ foods
- Comprehensive nutrition data (65+ nutrients)
- Free tier: 1,000 requests/hour

### Spoonacular API Key

1. Visit: https://spoonacular.com/food-api
2. Sign up for a free account
3. Get your API key from dashboard
4. Add to `.env`: `SPOONACULAR_API_KEY=your-key-here`

**Benefits:**
- Recipe data
- Product information
- Ingredient analysis
- Free tier: 150 requests/day

**Note:** The app works without API keys but with limited functionality.

## Verification

### Backend Verification

1. **Health Check:**
   ```bash
   curl http://localhost:8000/health
   ```
   Should return: `{"status": "healthy"}`

2. **API Documentation:**
   Visit http://localhost:8000/docs
   You should see interactive API documentation

3. **Test Registration:**
   ```bash
   curl -X POST http://localhost:8000/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "testpassword123",
       "first_name": "Test",
       "last_name": "User",
       "due_date": "2025-08-01"
     }'
   ```

### Frontend Verification

1. **App Loads:** The app should load without errors
2. **Navigation Works:** Bottom tabs should be clickable
3. **API Connection:** Try registering a user through the app
4. **Features Work:** Test food search, logging, and journal

## Troubleshooting

### Backend Issues

**Database Connection Error:**
```bash
# Check PostgreSQL is running
pg_isready

# Check connection string in .env
echo $DATABASE_URL
```

**Module Not Found:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

**Migration Errors:**
```bash
# Reset migrations (WARNING: deletes data)
alembic downgrade base
alembic upgrade head
```

**Port Already in Use:**
```bash
# Find process using port 8000
lsof -i :8000

# Kill the process
kill -9 <PID>

# Or use a different port
uvicorn app.main:app --reload --port 8001
```

### Frontend Issues

**Metro Bundler Issues:**
```bash
# Clear cache and restart
npm start -- --reset-cache
```

**Dependency Issues:**
```bash
# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**iOS Build Issues:**
```bash
# Reinstall pods (macOS only)
cd ios
pod install
cd ..
```

**Android Build Issues:**
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..
```

**Expo Issues:**
```bash
# Update Expo CLI
npm install -g expo-cli@latest

# Clear Expo cache
expo start -c
```

### Common Issues

**CORS Errors:**
- Make sure backend CORS is configured for your frontend URL
- Check `app/main.py` CORS settings

**Authentication Errors:**
- Verify SECRET_KEY is set in `.env`
- Check token expiration settings
- Clear app storage/cache

**API Key Errors:**
- Verify API keys are correct in `.env`
- Check API key quotas haven't been exceeded
- Test API keys independently

## Next Steps

After successful setup:

1. **Create a User Account** through the app
2. **Test Food Logging** with barcode scanner
3. **Explore Journal Features** for wellness tracking
4. **Set Up Notifications** for reminders
5. **Review API Documentation** at http://localhost:8000/docs

## Additional Resources

- **Backend README**: [backend/README.md](backend/README.md)
- **Frontend README**: [aurea-frontend/README.md](aurea-frontend/README.md)
- **Database Schema**: [.kiro/specs/database-schema.md](.kiro/specs/database-schema.md)
- **Contributing Guide**: [CONTRIBUTING.md](CONTRIBUTING.md)

## Support

For issues or questions:
- Check the troubleshooting section above
- Review the README files
- Check existing issues on GitHub
- Contact: support@aurea.app

---

**Happy Coding! 🚀**
