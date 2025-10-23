# RanchBot Web Application

Modern web application for searching and creating video clips from the Ranczo TV series.

This is a web UI for https://github.com/dam2452/RANCZO_KLIPY

## Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **httpx** - Async HTTP client for API proxy

## Project Structure

```
RanchBotWeb/
├── backend/          # FastAPI backend
│   ├── app/
│   │   ├── api/      # API endpoints
│   │   ├── core/     # Core functionality
│   │   ├── models/   # Data models
│   │   └── services/ # Business logic
│   ├── requirements.txt
│   └── README.md
├── vue-app/          # Vue.js frontend
│   ├── src/
│   │   ├── views/    # Page components
│   │   ├── components/
│   │   ├── stores/   # Pinia stores
│   │   └── services/ # API service
│   ├── package.json
│   └── README.md
└── README.md         # This file
```

## Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- Access to RanchBot API

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/dam2452/RanchBotWeb.git
   cd RanchBotWeb
   ```

2. **Setup Backend**
   ```bash
   cd backend
   python -m venv venv

   # Activate virtual environment
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate

   pip install -r requirements.txt

   # Configure environment
   cp .env.example .env
   # Edit .env with your settings
   ```

3. **Setup Frontend**
   ```bash
   cd vue-app
   npm install
   ```

### Running the Application

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```
lub ręcznie:
```bash
cd backend
source ../.venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd vue-app
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Features

- 🔍 **Search** - Search for quotes from the series
- 🎬 **Video Clips** - View and download video clips
- 💾 **Save Clips** - Save your favorite clips
- 👤 **User Authentication** - Secure session-based auth
- 📱 **Responsive** - Works on desktop and mobile

## Architecture

```
┌─────────────────┐
│   Vue Frontend  │  Port 5173
│   - UI/UX       │
│   - Routing     │
│   - State       │
└────────┬────────┘
         │
         │ HTTP/Axios
         ▼
┌─────────────────┐
│ FastAPI Backend │  Port 8000
│  - Auth         │
│  - Sessions     │
│  - API Proxy    │
└────────┬────────┘
         │
         │ HTTP/httpx
         ▼
┌─────────────────┐
│  External API   │
│   RanchBot      │
└─────────────────┘
```

## Development

### Backend Development
See [backend/README.md](backend/README.md) for detailed backend documentation.

### Frontend Development
See [vue-app/README.md](vue-app/README.md) for detailed frontend documentation.

## Deployment

### Production Build

**Frontend:**
```bash
cd vue-app
npm run build
```

**Backend:**
```bash
cd backend
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

Or use Docker (see individual READMEs for Docker configurations).

## API Endpoints

### Authentication
- `POST /auth/login` - Login user
- `GET /auth/logout` - Logout current session
- `POST /auth/logout-all` - Logout from all sessions (requires username & password)
- `GET /auth/user` - Get current user info

### RanchBot API (External)
- `POST http://192.168.1.210:8077/api/v1/auth/login` - Login to RanchBot API
- `POST http://192.168.1.210:8077/api/v1/auth/logout-all` - Logout from all sessions (clears all refresh tokens)

## Version History

- **v2.0.0** - Complete rewrite with Vue.js + FastAPI
- **v1.0.0** - Original PHP version (archived in `PHP-v1-Version` branch)
