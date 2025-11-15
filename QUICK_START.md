# Quick Start Guide

Get Aurea up and running in minutes!

## 🚀 Automated Setup

### macOS/Linux
```bash
chmod +x setup.sh
./setup.sh
```

### Windows
```bash
setup.bat
```

## 🔧 Manual Setup

### Backend

```bash
# 1. Navigate to backend
cd backend

# 2. Create virtual environment
python3 -m venv venv

# 3. Activate virtual environment
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate.bat  # Windows

# 4. Install dependencies
pip install -r requirements.txt

# 5. Set up environment
cp .env.example .env
# Edit .env with your settings

# 6. Run migrations
alembic upgrade head

# 7. Start server
uvicorn app.main:app --reload
```

**Backend is now running at:** `http://localhost:8000`
**API Docs:** `http://localhost:8000/docs`

### Frontend

```bash
# 1. Navigate to frontend
cd aurea-frontend

# 2. Install dependencies
npm install

# 3. Start development server
npm start

# 4. Choose platform
# Press 'i' for iOS simulator
# Press 'a' for Android emulator
# Press 'w' for web browser
```

## 📱 Running the App

### iOS (macOS only)
```bash
cd aurea-frontend
npm run ios
```

### Android
```bash
cd aurea-frontend
npm run android
```

### Web
```bash
cd aurea-frontend
npm run web
```

## 🔑 Configuration

### Backend Environment Variables

Edit `backend/.env`:

```env
# Required
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your-secret-key-here

# Optional API Keys
SPOONACULAR_API_KEY=your-key-here
USDA_API_KEY=your-key-here
```

### Frontend API URL

Edit `aurea-frontend/app/services/api.ts`:

```typescript
const API_BASE_URL = 'http://localhost:8000';
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
source venv/bin/activate
pytest
```

### Frontend Tests
```bash
cd aurea-frontend
npm test
```

## 🐛 Troubleshooting

### Backend Issues

**Port already in use:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9  # macOS/Linux
netstat -ano | findstr :8000   # Windows (find PID, then kill)
```

**Database errors:**
```bash
# Reset database
cd backend
rm test.db  # If using SQLite
alembic downgrade base
alembic upgrade head
```

**Import errors:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend Issues

**Metro bundler issues:**
```bash
npm start -- --reset-cache
```

**Dependency issues:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**iOS build issues:**
```bash
cd ios
pod install
cd ..
```

**Android build issues:**
```bash
cd android
./gradlew clean
cd ..
```

## 📚 Common Commands

### Backend
```bash
# Start server
uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black .
isort .

# Create migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

### Frontend
```bash
# Start dev server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on web
npm run web

# Clear cache
npm start -- --reset-cache
```

## 🔗 Useful URLs

- **Backend API:** http://localhost:8000
- **API Documentation:** http://localhost:8000/docs
- **Alternative Docs:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

## 📖 Next Steps

1. **Read the full README:** See `README.md` for detailed information
2. **Check the docs:** Backend API docs at `/docs`
3. **Explore the code:** Start with `backend/app/main.py` and `aurea-frontend/App.tsx`
4. **Run tests:** Make sure everything works
5. **Start developing:** See `CONTRIBUTING.md` for guidelines

## 💡 Tips

- Use the API docs at `/docs` to test endpoints
- Check logs for debugging: backend prints to console
- Use React Native Debugger for frontend debugging
- Keep dependencies updated regularly
- Run tests before committing changes

## 🆘 Getting Help

- Check the full README.md
- Review CONTRIBUTING.md
- Check existing issues on GitHub
- Create a new issue if needed
- Email: support@aurea.app

## 🎉 You're Ready!

Start building amazing features for expecting mothers! 🤰✨
