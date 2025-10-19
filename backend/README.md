# RanchBot Backend API (FastAPI)

Modern Python backend for the RanchBot application using FastAPI.

## Features

- **FastAPI** - Modern, fast web framework
- **Session-based authentication** - Secure cookie-based sessions
- **API Proxy** - Proxies requests to external RanchBot API
- **Type safety** - Pydantic models for request/response validation
- **Async** - Full async/await support for better performance

## Requirements

- Python 3.10+
- pip

## Installation

1. Create virtual environment:
   ```bash
   cd backend
   python -m venv venv
   ```

2. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` and set your configuration:
   ```
   RANCHBOT_API_URL=http://your-api-url/api/v1
   DEV_JWT_TOKEN=your_jwt_token
   SECRET_KEY=generate-random-secret-key
   ```

## Running

### Development

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

Or:

```bash
cd backend
python -m app.main
```

The API will be available at: `http://localhost:8000`

### API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Authentication

- `POST /auth/login` - Login (form data: login, password)
- `GET /auth/logout` - Logout
- `GET /auth/user` - Get current user info

### API Proxy

- `POST /api/json` - Proxy JSON API requests
- `POST /api/video` - Proxy video API requests (returns blob)

### Clips

- `GET /clips?action=get_clips` - Get user's clips
- `GET /clips/video/{clip_id}` - Get video for specific clip

## Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   │   ├── auth.py       # Authentication
│   │   ├── proxy.py      # API proxy
│   │   └── clips.py      # Clips management
│   ├── core/             # Core functionality
│   │   ├── config.py     # Configuration
│   │   ├── sessions.py   # Session management
│   │   └── dependencies.py # FastAPI dependencies
│   ├── models/           # Pydantic models
│   │   ├── user.py
│   │   └── clip.py
│   ├── services/         # Business logic
│   │   └── ranchbot_api.py  # External API client
│   └── main.py           # FastAPI app
├── requirements.txt      # Python dependencies
├── .env.example          # Example environment variables
└── README.md
```

## Development

### Adding new endpoints

1. Create router in `app/api/`
2. Add router to `app/main.py`
3. Create models in `app/models/` if needed

### Testing

```bash
# Install dev dependencies
pip install pytest httpx pytest-asyncio

# Run tests
pytest
```

## Deployment

### Production

1. Set `reload=False` in config
2. Use production ASGI server:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```

3. Or use Docker:
   ```dockerfile
   FROM python:3.11-slim
   WORKDIR /app
   COPY requirements.txt .
   RUN pip install --no-cache-dir -r requirements.txt
   COPY . .
   CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
   ```

## License

Same as RanchBot project
