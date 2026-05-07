# Frontend (Vue 3 + TypeScript)

Modern Vue.js frontend for RanchBot application.

## Requirements

- Node.js 20.19+ or 22.12+
- Backend running on port 8000

## Quick Start

```bash
cd frontend

# Install dependencies (first time only)
npm install

# Run development server
npm run dev
```

Frontend will be available at: http://localhost:5173

## Project Structure

```
vue-app/
├── src/
│   ├── views/         # Page components (HomeView, LoginView, SavedClipsView, etc.)
│   ├── components/    # Reusable components
│   ├── stores/        # Pinia stores (state management)
│   ├── services/      # API service layer
│   ├── router/        # Vue Router config
│   └── assets/        # Static assets (CSS, images)
├── public/            # Public static files
└── package.json
```

## Other Commands

```bash
# Type checking
npm run type-check

# Lint and fix
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Tech Stack

- Vue 3 (Composition API)
- TypeScript
- Vite
- Pinia (state management)
- Vue Router
- Axios
- Tailwind CSS
