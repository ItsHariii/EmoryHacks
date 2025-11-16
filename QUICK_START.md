# Aurea - Quick Start Guide

Get up and running in 5 minutes!

## Prerequisites Check

```bash
# Check Python version (need 3.9+)
python3 --version

# Check Node.js version (need 16+)
node --version

# Check PostgreSQL (optional, can use SQLite)
psql --version
```

## Backend (2 minutes)

```bash
# 1. Setup
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env - set DATABASE_URL and SECRET_KEY

# 3. Database
alembic upgrade head

# 4. Run
uvicorn app.main:app --reload
```

✅ Backend running at http://localhost:8000

## Frontend (2 minutes)

```bash
# 1. Setup
cd aurea-frontend
npm install

# 2. Run
npm start

# 3. Choose platform
# Press 'i' for iOS
# Press 'a' for Android
# Press 'w' for Web
```

✅ Frontend running!

## Verify Setup

1. **Backend Health**: http://localhost:8000/health
2. **API Docs**: http://localhost:8000/docs
3. **Frontend**: Should load in simulator/browser

## Quick Test

### Register a User (via API docs)

1. Go to http://localhost:8000/docs
2. Find `POST /auth/register`
3. Click "Try it out"
4. Enter:
   ```json
   {
     "email": "test@example.com",
     "password": "password123",
     "first_name": "Test",
     "last_name": "User",
     "due_date": "2025-08-01"
   }
   ```
5. Click "Execute"

### Login (via app)

1. Open the app
2. Enter credentials
3. Start logging food!

## Common Issues

**Backend won't start?**
```bash
# Check if port 8000 is in use
lsof -i :8000
# Use different port
uvicorn app.main:app --reload --port 8001
```

**Frontend won't start?**
```bash
# Clear cache
npm start -- --reset-cache
```

**Database errors?**
```bash
# Use SQLite instead (in .env)
DATABASE_URL=sqlite:///./aurea.db
```

## Next Steps

- 📖 Read [SETUP.md](SETUP.md) for detailed setup
- 📚 Check [README.md](README.md) for features
- 🔧 See [backend/README.md](backend/README.md) for API docs
- 📱 See [aurea-frontend/README.md](aurea-frontend/README.md) for app docs

## Need Help?

- Check [SETUP.md](SETUP.md) troubleshooting section
- Review API docs at http://localhost:8000/docs
- Contact: support@aurea.app

---

**Happy Coding! 🚀**
