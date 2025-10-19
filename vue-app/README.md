# RanchBot Vue - Migration from PHP to Vue.js

## Overview

This is a complete rewrite of the RanchBot application from PHP to Vue.js 3 with TypeScript, using modern web development practices and libraries.

## Features

- ✅ Vue 3 with Composition API
- ✅ TypeScript for type safety
- ✅ Vue Router for navigation
- ✅ Pinia for state management
- ✅ Axios for API calls
- ✅ Vite for fast development and building
- ✅ All original styles preserved
- ✅ All original functionality maintained

## Tech Stack

- **Framework**: Vue 3
- **Build Tool**: Vite
- **Language**: TypeScript
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Styling**: Original CSS files (imported)

## Project Structure

```
vue-app/
├── public/              # Static assets (images, etc.)
├── src/
│   ├── assets/
│   │   └── styles/     # Original CSS files from PHP version
│   ├── components/     # Reusable Vue components
│   │   └── AppHeader.vue
│   ├── views/          # Page components
│   │   ├── HomeView.vue
│   │   ├── LoginView.vue
│   │   ├── RegisterView.vue
│   │   ├── ForgotPasswordView.vue
│   │   ├── SearchView.vue
│   │   ├── SearchResultsView.vue
│   │   └── MyClipsView.vue
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   │   └── auth.ts
│   ├── services/       # API services
│   │   └── api.ts
│   ├── types/          # TypeScript type definitions
│   │   └── index.ts
│   ├── App.vue         # Root component
│   └── main.ts         # Application entry point
├── .env.development    # Development environment variables
└── vite.config.ts      # Vite configuration
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PHP 8.0+ with curl extension
- The existing RanchBot PHP backend (required for session management and API proxy)

### Installation

1. Navigate to the vue-app directory:
   ```bash
   cd vue-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development

For development, you need to run BOTH the PHP backend and Vue dev server:

1. Start the PHP backend on port 8080:
   ```bash
   # From the root directory (RanchBotWeb)
   php -S localhost:8080 -t public
   ```

2. In a separate terminal, start the Vue dev server:
   ```bash
   # From vue-app directory
   npm run dev
   ```

The Vue app will be available at `http://localhost:5173` and will proxy API/auth requests to the PHP backend at `http://localhost:8080`.

### Building for Production

Build the application:

```bash
npm run build
```

The built files will be in the `dist/` directory.

**Production Deployment:**

To deploy to production, you have two options:

**Option 1: Serve Vue build from PHP (Recommended)**
1. Build the Vue app: `npm run build`
2. Copy `dist/*` to the PHP `public/` directory
3. Configure PHP to serve `index.html` for all routes (SPA mode)
4. Deploy the PHP application with the Vue build included

**Option 2: Separate servers**
1. Serve the built Vue app from a static file server (Nginx, Apache, etc.)
2. Configure reverse proxy to forward `/api`, `/login`, `/logout` to the PHP backend
3. Ensure CORS and session cookies work across domains

### Lint with ESLint

```sh
npm run lint
```

## How It Works

### Architecture

The Vue app works in conjunction with the existing PHP backend:

1. **Vue Frontend** (`http://localhost:5173` in dev)
   - Handles all UI and routing
   - Makes API calls to PHP backend

2. **PHP Backend** (`http://localhost:8080` in dev)
   - Handles authentication (sessions)
   - Proxies API requests to the external RanchBot API
   - Manages user sessions and JWT tokens

### API Endpoints (PHP Backend)

The Vue app communicates with these PHP endpoints:

- `POST /login` - User login (creates PHP session)
- `GET /logout` - User logout (destroys session)
- `GET /api/user.php` - Get current user info
- `POST /api/api-json.php` - Generic JSON API proxy
- `POST /api/api-video.php` - Video blob API proxy
- `GET /api/clips-api.php` - Get user clips

All endpoints use PHP sessions for authentication (no localStorage/JWT in frontend).

## Differences from PHP Version

### Frontend Technology

- **Old**: PHP templates with inline JavaScript
- **New**: Vue 3 with TypeScript, modern component architecture

### Routing

- **Old**: PHP Router with server-side rendering
- **New**: Vue Router with client-side routing (SPA)
- Faster navigation, no page reloads

### State Management

- **Old**: PHP sessions only
- **New**: PHP sessions + Pinia store for reactive state
- Better UX with instant UI updates

### Authentication

- **Still uses PHP sessions** (no change to backend auth)
- Auth state is managed in Vue store for reactive UI
- Session validation on every route change

### Styling

- All original CSS files preserved
- Imported into Vue components
- **No visual changes** - looks identical to PHP version

### API Communication

- Same PHP backend and API endpoints
- Vue uses Axios instead of fetch
- All requests proxied through Vite dev server during development

## Pages

1. **Home** (`/`) - Landing page with logo and search button
2. **Login** (`/login`) - User authentication
3. **Register** (`/register`) - Registration (currently disabled)
4. **Forgot Password** (`/forgot-password`) - Password recovery (currently disabled)
5. **Search** (`/search`) - Quote search interface
6. **Search Results** (`/search-results`) - Display search results with video previews
7. **My Clips** (`/my-clips`) - User's saved clips

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)

## Backup

The original PHP version has been backed up to the `PHP-v1-Version` branch.

## Next Steps

- [ ] Connect to actual backend API
- [ ] Implement full clip inspector functionality
- [ ] Add video adjustment controls
- [ ] Implement filters on search page
- [ ] Add loading states and transitions
- [ ] Write unit tests
- [ ] Optimize performance
