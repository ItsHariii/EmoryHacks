# Ovi Pregnancy Nutrition & Wellness Backend

This is the backend service for the Ovi Pregnancy Nutrition & Wellness Companion App, built with FastAPI and PostgreSQL/Supabase.

## Features

- User authentication with JWT tokens
- Food logging and tracking
- Nutrition analysis and recommendations
- Weekly insights and progress tracking
- Trimester-specific guidance
- Integration with USDA FoodData Central API

## Tech Stack

- **Framework**: FastAPI
- **Database**: PostgreSQL (with Supabase)
- **ORM**: SQLAlchemy
- **Authentication**: JWT
- **API Documentation**: Swagger UI & ReDoc
- **Testing**: Pytest
- **Containerization**: Docker

## Prerequisites

- Python 3.8+
- PostgreSQL 13+
- Poetry (for dependency management)
- Docker (optional)

## Setup

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/ovi-backend.git
   cd ovi-backend
   ```

2. Create and activate a virtual environment
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

3. Install dependencies
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit the `.env` file with your configuration.

5. Set up the database
   - Create a new PostgreSQL database
   - Update the `DATABASE_URL` in `.env`
   - Run migrations:
     ```bash
     alembic upgrade head
     ```

## Running the Application

### Development

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

### Production

Using Gunicorn with Uvicorn workers:

```bash
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

## API Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Testing

```bash
pytest
```

## Environment Variables

See `.env.example` for all available environment variables.

## Project Structure

```
backend/
├── app/
│   ├── api/               # API routes
│   ├── core/              # Core functionality
│   ├── models/            # Database models
│   ├── schemas/           # Pydantic models
│   ├── services/          # Business logic
│   └── main.py            # FastAPI application
├── tests/                 # Test files
├── alembic/               # Database migrations
├── .env.example           # Example environment variables
├── .gitignore
├── poetry.lock
├── pyproject.toml
└── README.md
```

## Deployment

### Docker

Build the Docker image:

```bash
docker build -t ovi-backend .
```

Run the container:

```bash
docker run -d --name ovi-backend -p 8000:80 --env-file .env ovi-backend
```

### Cloud Providers

- **Render**: [Deploy to Render](https://render.com/)
- **Railway**: [Deploy on Railway](https://railway.app/)
- **AWS**: Deploy using ECS or EKS

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
