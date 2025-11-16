# Aurea Backend API

FastAPI-based backend for the Aurea pregnancy nutrition and wellness platform.

## 🚀 Quick Start

### Prerequisites

- Python 3.9 or higher
- PostgreSQL 13+ (or SQLite for development)
- pip or poetry for package management

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd aurea/backend
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   
   # Activate on macOS/Linux:
   source venv/bin/activate
   
   # Activate on Windows:
   venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/aurea_db
   
   # Security
   SECRET_KEY=your-secret-key-here-min-32-characters
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=30
   
   # API Keys
   SPOONACULAR_API_KEY=your-spoonacular-api-key
   USDA_API_KEY=your-usda-api-key
   
   # Environment
   ENVIRONMENT=development
   DEBUG=True
   ```

5. **Run database migrations**
   ```bash
   alembic upgrade head
   ```

6. **Start the development server**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **Alternative Docs**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 📁 Project Structure

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── auth.py            # Authentication endpoints
│   │   ├── food/              # Food-related endpoints
│   │   │   ├── logging.py     # Food logging
│   │   │   ├── nutrition.py   # Nutrition analysis
│   │   │   ├── safety.py      # Food safety checks
│   │   │   └── search.py      # Food search
│   │   └── journal.py         # Journal endpoints
│   ├── core/                   # Core functionality
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # Database connection
│   │   └── security.py        # Security utilities
│   ├── models/                 # Database models
│   │   ├── food.py            # Food & FoodLog models
│   │   ├── user.py            # User model
│   │   └── journal.py         # Journal model
│   ├── schemas/                # Pydantic schemas
│   │   ├── food.py            # Food schemas
│   │   ├── user.py            # User schemas
│   │   └── journal.py         # Journal schemas
│   ├── services/               # Business logic
│   │   ├── nutrition_calculator_service.py
│   │   ├── pregnancy_safety_service.py
│   │   ├── spoonacular_service.py
│   │   └── usda_service.py
│   ├── utils/                  # Utility functions
│   │   └── food_factory.py    # Food creation utilities
│   └── main.py                 # Application entry point
├── migrations/                 # Alembic migrations
├── tests/                      # Test suite
├── .env                        # Environment variables (not in git)
├── .env.example                # Environment template
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user

### Food Management
- `GET /food/search` - Search foods (USDA + Spoonacular)
- `GET /food/{food_id}` - Get food details
- `POST /food/log` - Log food consumption
- `GET /food/log` - Get food logs (with filters)
- `GET /food/log/{log_id}` - Get specific food log
- `PATCH /food/log/{log_id}` - Update food log
- `DELETE /food/log/{log_id}` - Delete food log
- `GET /food/log/summary` - Get daily nutrition summary
- `GET /food/log/weekly-summary` - Get weekly nutrition summary
- `POST /food/safety-check` - Check food safety for pregnancy

### Journal
- `POST /journal/entries` - Create journal entry
- `GET /journal/entries` - Get journal entries
- `GET /journal/entries/{entry_id}` - Get specific entry
- `PUT /journal/entries/{entry_id}` - Update entry
- `DELETE /journal/entries/{entry_id}` - Delete entry

### Health
- `GET /health` - Health check endpoint

## 🗄️ Database

### Models

**User**
- Authentication and profile information
- Due date and pregnancy tracking
- Dietary preferences and allergies

**Food**
- Comprehensive food database
- Nutrition data (macros + micronutrients)
- Pregnancy safety information
- Source tracking (USDA, Spoonacular, Manual)

**FoodLog**
- User food consumption records
- Calculated nutrition based on serving size
- Meal type and timestamps
- Soft delete support

**JournalEntry**
- Daily wellness tracking
- Symptoms, mood, energy levels
- Notes and observations

### Migrations

Create a new migration:
```bash
alembic revision --autogenerate -m "Description of changes"
```

Apply migrations:
```bash
alembic upgrade head
```

Rollback migration:
```bash
alembic downgrade -1
```

## 🧪 Testing

Run all tests:
```bash
pytest
```

Run with coverage:
```bash
pytest --cov=app tests/
```

Run specific test file:
```bash
pytest tests/test_food_logging.py
```

## 🔧 Development

### Code Quality

Format code:
```bash
black app/
isort app/
```

Type checking:
```bash
mypy app/
```

Linting:
```bash
flake8 app/
```

### Pre-commit Hooks

Install pre-commit hooks:
```bash
pre-commit install
```

Run manually:
```bash
pre-commit run --all-files
```

## 🚢 Deployment

### Docker

Build image:
```bash
docker build -t aurea-backend .
```

Run container:
```bash
docker run -p 8000:8000 --env-file .env aurea-backend
```

### Production

1. Set `ENVIRONMENT=production` in `.env`
2. Set `DEBUG=False`
3. Use a production-grade database (PostgreSQL)
4. Set up proper logging
5. Configure CORS for your frontend domain
6. Use a reverse proxy (nginx)
7. Enable HTTPS

Start production server:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 🔐 Security

- JWT token-based authentication
- Password hashing with bcrypt
- SQL injection prevention via SQLAlchemy ORM
- Input validation with Pydantic
- CORS protection
- Rate limiting (recommended for production)

## 📊 Key Features

### Nutrition Tracking
- Comprehensive micronutrient tracking (65+ nutrients)
- Automatic nutrition calculation based on serving sizes
- Support for custom serving units
- Daily and weekly nutrition summaries

### Food Safety
- Pregnancy-specific food safety recommendations
- Ingredient analysis
- Safety status (safe, limited, avoid)
- Detailed safety notes

### External Integrations
- **USDA FoodData Central**: 500,000+ foods with detailed nutrition
- **Spoonacular API**: Recipe and product data
- Automatic caching of external data

## 🐛 Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql -U username -d aurea_db
```

### Migration Issues
```bash
# Reset database (WARNING: deletes all data)
alembic downgrade base
alembic upgrade head
```

### API Key Issues
- Verify API keys in `.env`
- Check API key quotas
- Test API keys independently

## 📝 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Yes | - |
| `SECRET_KEY` | JWT secret key (32+ chars) | Yes | - |
| `ALGORITHM` | JWT algorithm | No | HS256 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration | No | 30 |
| `SPOONACULAR_API_KEY` | Spoonacular API key | No | - |
| `USDA_API_KEY` | USDA API key | No | - |
| `ENVIRONMENT` | Environment name | No | development |
| `DEBUG` | Debug mode | No | True |

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Run code quality checks
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
