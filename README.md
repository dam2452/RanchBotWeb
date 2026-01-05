# 🎬 RanchBot Web

Modern web application for searching and creating video clips from the popular Polish series "Ranczo."

**This is a web UI for [RANCZO_KLIPY API](https://github.com/dam2452/RANCZO_KLIPY)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600.svg)](https://www.rabbitmq.com/)

---

## 🇵🇱 Wersja Polska

Dla polskiej wersji dokumentacji, zobacz [README.pl.md](README.pl.md).

---

## 📺 Demo

### 🖥️ Desktop Version
[![Desktop Demo](https://img.youtube.com/vi/NYQvrILlGaU/maxresdefault.jpg)](https://youtu.be/NYQvrILlGaU)

### 📱 Mobile Version
[![Mobile Demo](https://img.youtube.com/vi/m9J0WIAAyxs/maxresdefault.jpg)](https://youtube.com/shorts/m9J0WIAAyxs)

### 📸 Screenshots

<table>
  <tr>
    <td align="center">
      <img src="screenshots/Desktop Home.png" alt="Desktop Home" width="400"/><br/>
      <sub><b>Desktop - Home Page</b></sub>
    </td>
    <td align="center">
      <img src="screenshots/Mobile Search.png" alt="Mobile Search" width="200"/><br/>
      <sub><b>Mobile - Search</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/Desktop My Clips.png" alt="Desktop My Clips" width="400"/><br/>
      <sub><b>Desktop - Saved Clips</b></sub>
    </td>
    <td align="center">
      <img src="screenshots/Mobile Search Results.png" alt="Mobile Search Results" width="200"/><br/>
      <sub><b>Mobile - Search Results</b></sub>
    </td>
  </tr>
</table>

---

## 🌟 Features

### 1. 🔍 Smart Search
- Search for quotes and dialogues from the series
- Fast and accurate text-based search
- Real-time search results

### 2. 🎬 Video Clip Management
- View video clips with selected scenes
- Download clips in MP4 format
- Save favorite clips to personal collection
- Automatic thumbnail generation with caching

### 3. 🎯 Clip Adjustment
- Fine-tune clip start and end times
- Preview changes in real-time
- Create custom compilations

### 4. 👤 User Management
- Secure session-based authentication
- Personal clip collections
- User preferences

### 5. 📱 Responsive Design
- Works perfectly on desktop, tablet, and mobile
- Touch-optimized mobile interface
- Progressive Web App ready

### 6. 🔒 Security
- HTTP-only session cookies
- JWT token validation
- API proxy for secure communication
- CORS configuration

### 7. ⚡ Asynchronous Processing (RabbitMQ)
- Background processing for thumbnails and video adjustments
- Non-blocking operations
- Multiple workers for parallel processing

---

## 🛠️ Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS

### Backend
- **FastAPI** - Modern Python web framework
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation
- **httpx** - Async HTTP client
- **Pillow** - Image processing
- **python-jose** - JWT handling
- **RabbitMQ** - Message broker for queue processing
- **pika** - RabbitMQ client for Python

### Infrastructure
- **RabbitMQ** - Message queue for asynchronous task processing
- **Docker** - Containerization
- **Caddy** - Web server for production

---

## 📋 Requirements

**System:**
- Node.js 20.19+ or 22.12+
- Python 3.10+
- RabbitMQ 3.13+
- Docker (optional, but recommended)

**Backend Dependencies:**
- FastAPI, Uvicorn, Pydantic, httpx, Pillow, python-jose, passlib, pika

**Frontend Dependencies:**
- Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios, Tailwind CSS

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/dam2452/RanchBotWeb.git
cd RanchBotWeb

# 2. Configure environment
cp .env.example .env
# Edit .env with your settings

# 3. Build and start all services (backend, frontend, RabbitMQ, workers)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

**Access:**
- Application: http://localhost:8880
- Backend API: http://localhost:8000
- RabbitMQ Management: http://localhost:15672 (guest/guest)

### Option 2: Manual Setup

#### Prerequisites
1. Install and start RabbitMQ:
```bash
# Ubuntu/Debian
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server

# macOS
brew install rabbitmq
brew services start rabbitmq

# Windows - download from https://www.rabbitmq.com/download.html
```

#### Installation

```bash
# 1. Clone the repository
git clone https://github.com/dam2452/RanchBotWeb.git
cd RanchBotWeb

# 2. Setup Backend
cd backend
python -m venv ../.venv
source ../.venv/bin/activate  # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings (including RabbitMQ credentials)

# 3. Setup Frontend
cd ../vue-app
npm install
```

#### Running

**Terminal 1 - RabbitMQ (if not running as service):**
```bash
rabbitmq-server
```

**Terminal 2 - Backend API:**
```bash
cd backend
source ../.venv/bin/activate  # Windows: ..\.venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - Thumbnail Worker:**
```bash
cd backend
source ../.venv/bin/activate
python workers/thumbnail_worker.py
```

**Terminal 4 - Adjustment Worker:**
```bash
cd backend
source ../.venv/bin/activate
python workers/adjustment_worker.py
```

**Terminal 5 - Frontend:**
```bash
cd vue-app
npm run dev
```

**Access:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- RabbitMQ Management: http://localhost:15672

---

## 🐳 Docker Deployment

The application uses Docker Compose with the following services:

- **rabbitmq** - Message broker for asynchronous task processing
- **backend** - FastAPI application server
- **worker-thumbnail** - Background worker for thumbnail generation
- **worker-adjustment** - Background worker for video adjustments
- **frontend** - Caddy web server serving Vue.js application

```bash
# Build and start all services (production)
docker-compose up -d

# Build and start with development mode (exposes backend port 8000)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f worker-thumbnail
docker-compose logs -f worker-adjustment

# Restart specific service
docker-compose restart backend

# Stop all services
docker-compose down

# Rebuild after code changes
docker-compose up -d --build
```

---

## 📡 API Endpoints

### 🔐 Authentication (`/auth`)
- `POST /auth/login` - Login user and create session
- `GET /auth/logout` - Logout current session
- `POST /auth/logout-all` - Logout from all sessions
- `GET /auth/user` - Get current user information

### 🎬 Clips Management (`/clips`)
- `GET /clips?action=get_clips` - Get user's saved clips
- `GET /clips/video/{clip_id}` - Get video file for a specific clip
- `GET /clips/thumbnail/{clip_id}` - Get thumbnail for a specific clip
- `POST /clips/save` - Save clip to user collection
- `POST /clips/delete` - Delete clip from user collection

### 🔄 API Proxy (`/api`)
- `POST /api/json` - Proxy JSON API requests
- `POST /api/video` - Proxy video API requests (returns blob)
- `POST /api/thumbnail` - Generate thumbnail from video (async with RabbitMQ)
- `POST /api/adjust-preview` - Adjust video timing (async with RabbitMQ)
- `POST /api/batch-load` - Parallel batch loading of clips

### 📚 API Documentation

Set `ENABLE_API_DOCS=True` in `backend/.env` to access:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🏗️ Architecture

- **Frontend (Vue 3)** - User interface on port 5173/8880
- **Backend (FastAPI)** - API server on port 8000, proxies to external API
- **RabbitMQ** - Message queue for async processing (thumbnails, video adjustments)
- **Workers** - Background processes consuming jobs from RabbitMQ
- **External API (RANCZO_KLIPY)** - Video processing service

---

## 🔧 Development

### Backend Development

```bash
cd backend

# Run tests
pytest tests/ -v

# Run specific test
pytest tests/test_auth.py -v

# Enable API documentation
echo "ENABLE_API_DOCS=True" >> .env

# Start with hot reload
python -m uvicorn app.main:app --reload
```

### Frontend Development

```bash
cd vue-app

# Type checking
npm run type-check

# Lint and fix
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

### Worker Development

```bash
cd backend
source ../.venv/bin/activate

# Run thumbnail worker with debug output
PYTHONUNBUFFERED=1 python workers/thumbnail_worker.py

# Run adjustment worker
PYTHONUNBUFFERED=1 python workers/adjustment_worker.py
```

---

## 📝 Environment Variables

### Backend (`.env`)
```env
# RanchBot API
RANCHBOT_API_URL=http://your-api-url:8077/api/v1
DEV_JWT_TOKEN=your_jwt_token_here

# Session & Security
SECRET_KEY=your-secret-key-here
SESSION_MAX_AGE=86400

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Server
HOST=0.0.0.0
PORT=8000
RELOAD=True
ENABLE_API_DOCS=False  # Set to True for API documentation

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

### Docker Compose (`.env`)
```env
# RanchBot API
RANCHBOT_API_URL=http://your-api-url:8077/api/v1

# Security
SECRET_KEY=your-secret-key-here
SESSION_MAX_AGE=86400

# CORS
ALLOWED_ORIGINS=http://localhost:8880

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📜 Version History

- **v2.0.5** - Added RabbitMQ queue processing, async thumbnail/adjustment generation
- **v2.0.4** - Optimized Docker builds and caching
- **v2.0.0** - Complete rewrite with Vue.js + FastAPI
- **v1.0.0** - Original PHP version (archived in `PHP-v1-Version` branch)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🚀 Access

Interested in using RanchBot Web? Contact via Telegram: [@dam2452](https://t.me/dam2452)

GitHub: [@dam2452](https://github.com/dam2452)

---

## ☕ Support

If you like this project and would like to support its development, consider getting me a mamrot!

[![Get me a Mamrot](Get_me_a_Mamrot.png)](https://buymeacoffee.com/dam2452)
