# Backend (FastAPI)

FastAPI backend for RanchBot application.

## Requirements

- Python 3.10+
- Virtual environment in parent directory (`.venv/`)

## Quick Start

```bash
cd backend

# Activate virtual environment
source ../.venv/bin/activate  # Linux/Mac
..\.venv\Scripts\activate     # Windows

# Install dependencies (first time only)
pip install -r requirements.txt

# Configure .env file (first time only)
cp .env.example .env
# Edit .env with your settings

# Run development server
python -m uvicorn app.main:app --reload --port 8000
```

Backend will be available at:
- API: http://localhost:8000
- Docs: http://localhost:8000/docs

## Project Structure

```
backend/
├── app/
│   ├── api/          # API endpoints (auth.py, clips.py, proxy.py)
│   ├── core/         # Core functionality (config, sessions, dependencies)
│   ├── models/       # Pydantic models
│   ├── services/     # Business logic
│   └── main.py       # FastAPI app
├── tests/            # Tests
└── requirements.txt
```

## Testing

```bash
pytest tests/ -v
```
