.PHONY: help install dev test test-cov lint format type migrate migrate-rev worker docker-up docker-down clean

PYTHON ?= python
PIP ?= pip
UVICORN_HOST ?= 0.0.0.0
UVICORN_PORT ?= 8000

help:
	@echo "Targets:"
	@echo "  install       - install runtime + dev deps"
	@echo "  dev           - run uvicorn with reload"
	@echo "  test          - run pytest"
	@echo "  test-cov      - run pytest with coverage"
	@echo "  lint          - ruff check + format check"
	@echo "  format        - ruff format (writes)"
	@echo "  type          - mypy app"
	@echo "  migrate       - alembic upgrade head"
	@echo "  migrate-rev   - alembic revision --autogenerate -m '<msg>'"
	@echo "  worker        - run arq photo worker"
	@echo "  docker-up     - docker compose up --build"
	@echo "  docker-down   - docker compose down"
	@echo "  clean         - remove caches"

install:
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt

dev:
	uvicorn app.main:app --reload --host $(UVICORN_HOST) --port $(UVICORN_PORT)

test:
	pytest -q

test-cov:
	pytest -q --cov=app --cov-report=term-missing --cov-report=xml

lint:
	ruff check app tests
	ruff format --check app tests

format:
	ruff format app tests
	ruff check --fix app tests

type:
	mypy app

migrate:
	alembic upgrade head

migrate-rev:
	@if [ -z "$(m)" ]; then echo "Usage: make migrate-rev m='message'"; exit 1; fi
	alembic revision --autogenerate -m "$(m)"

worker:
	arq app.workers.photo_worker.WorkerSettings

docker-up:
	docker compose up --build

docker-down:
	docker compose down

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .ruff_cache -exec rm -rf {} + 2>/dev/null || true
	rm -rf .coverage coverage.xml htmlcov
