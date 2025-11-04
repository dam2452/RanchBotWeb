# Docker Deployment

## Quick Start

1. **Configure environment variables**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your RanchBot API URL and secrets.

2. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Services

### Backend (FastAPI)
- **Port:** 8000
- **Image:** Built from `./backend/Dockerfile`
- **Technology:** Python 3.11, FastAPI, Uvicorn

### Frontend (Vue.js + Caddy)
- **Port:** 80
- **Image:** Built from `./vue-app/Dockerfile`
- **Technology:** Node.js 22, Vue.js 3, Caddy

## Architecture

```
┌─────────────────────────────────────┐
│         Docker Network              │
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Frontend   │  │   Backend   │ │
│  │  Vue.js +    │  │   FastAPI   │ │
│  │    Caddy     │  │  Uvicorn    │ │
│  │  Port: 80    │  │  Port: 8000 │ │
│  └──────┬───────┘  └──────┬──────┘ │
│         │                 │         │
│         └────────┬────────┘         │
└──────────────────┼──────────────────┘
                   │
           External API Proxy
                   │
         ┌─────────▼──────────┐
         │   RanchBot API     │
         │  192.168.1.210     │
         └────────────────────┘
```

## Commands

### Start services
```bash
docker-compose up -d
```

### Stop services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

### Remove everything (including volumes)
```bash
docker-compose down -v
```

## Production Deployment

For production, consider:

1. **Use environment-specific builds**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Add volume mounts for persistence** (if needed)

3. **Configure reverse proxy** (Nginx, Caddy, Traefik)

4. **Enable HTTPS** with Let's Encrypt

5. **Set secure SECRET_KEY** in environment variables

## Building Individual Services

### Backend only
```bash
cd backend
docker build -t ranchbot-backend .
docker run -p 8000:8000 --env-file .env ranchbot-backend
```

### Frontend only
```bash
cd vue-app
docker build -t ranchbot-frontend .
docker run -p 80:80 ranchbot-frontend
```

## Troubleshooting

### Frontend can't connect to backend
- Check that both containers are on the same network
- Verify `ALLOWED_ORIGINS` includes your domain (e.g., `https://ranchbot.pl`)
  - **Important:** Cannot use `*` with credentials - must specify exact origins
- Check Caddy proxy configuration in `vue-app/Caddyfile`

### Backend can't reach external API
- Verify `RANCHBOT_API_URL` in backend/.env
- Check network connectivity from container:
  ```bash
  docker exec ranchbot-backend curl http://192.168.1.210:8077/api/v1
  ```

### Port conflicts
If ports 80 or 8000 are already in use, modify `docker-compose.yml`:
```yaml
ports:
  - "8080:80"    # Frontend on port 8080
  - "8001:8000"  # Backend on port 8001
```
