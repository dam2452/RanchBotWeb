# 🎬 RanchBot Web

Nowoczesna aplikacja webowa do wyszukiwania i tworzenia klipów wideo z popularnego polskiego serialu "Ranczo".

**To jest interfejs webowy dla [RANCZO_KLIPY API](https://github.com/dam2452/RANCZO_KLIPY)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)
[![RabbitMQ](https://img.shields.io/badge/RabbitMQ-3.13-FF6600.svg)](https://www.rabbitmq.com/)

---

## 🇬🇧 English Version

For English documentation, see [README.md](README.md).

---

## 📺 Demo

### 🖥️ Wersja Desktopowa
[![Demo Desktop](https://img.youtube.com/vi/NYQvrILlGaU/maxresdefault.jpg)](https://youtu.be/NYQvrILlGaU)

### 📱 Wersja Mobilna
[![Demo Mobilne](https://img.youtube.com/vi/m9J0WIAAyxs/maxresdefault.jpg)](https://youtube.com/shorts/m9J0WIAAyxs)

### 📸 Zrzuty ekranu

<table>
  <tr>
    <td align="center">
      <img src="screenshots/Desktop Home.png" alt="Desktop Home" width="400"/><br/>
      <sub><b>Desktop - Strona główna</b></sub>
    </td>
    <td align="center">
      <img src="screenshots/Mobile Search.png" alt="Mobile Search" width="200"/><br/>
      <sub><b>Mobile - Wyszukiwanie</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/Desktop My Clips.png" alt="Desktop My Clips" width="400"/><br/>
      <sub><b>Desktop - Zapisane klipy</b></sub>
    </td>
    <td align="center">
      <img src="screenshots/Mobile Search Results.png" alt="Mobile Search Results" width="200"/><br/>
      <sub><b>Mobile - Wyniki wyszukiwania</b></sub>
    </td>
  </tr>
</table>

---

## 🌟 Funkcje

### 1. 🔍 Inteligentne Wyszukiwanie
- Wyszukiwanie cytatów i dialogów z serialu
- Szybkie i dokładne wyszukiwanie tekstowe
- Wyniki wyszukiwania w czasie rzeczywistym

### 2. 🎬 Zarządzanie Klipami
- Przeglądanie klipów wideo z wybranymi scenami
- Pobieranie klipów w formacie MP4
- Zapisywanie ulubionych klipów do osobistej kolekcji
- Automatyczne generowanie miniatur z cache'owaniem

### 3. 🎯 Dostosowywanie Klipów
- Precyzyjne ustawianie czasu rozpoczęcia i zakończenia klipu
- Podgląd zmian w czasie rzeczywistym
- Tworzenie własnych kompilacji

### 4. 👤 Zarządzanie Użytkownikami
- Bezpieczna autentykacja oparta na sesjach
- Osobiste kolekcje klipów
- Preferencje użytkownika

### 5. 📱 Responsywny Design
- Działa perfekcyjnie na komputerze, tablecie i telefonie
- Zoptymalizowany interfejs dotykowy na urządzenia mobilne
- Gotowość do Progressive Web App

### 6. 🔒 Bezpieczeństwo
- Ciasteczka HTTP-only dla sesji
- Walidacja tokenów JWT
- Proxy API dla bezpiecznej komunikacji
- Konfiguracja CORS

### 7. ⚡ Przetwarzanie Asynchroniczne (RabbitMQ)
- Przetwarzanie w tle miniatur i dostosowań wideo
- Operacje nieblokujące
- Wiele workerów do przetwarzania równoległego

---

## 🛠️ Stack Technologiczny

### Frontend
- **Vue 3** - Progresywny framework JavaScript
- **TypeScript** - Bezpieczeństwo typów
- **Vite** - Szybkie narzędzie do budowania
- **Pinia** - Zarządzanie stanem
- **Vue Router** - Routing po stronie klienta
- **Tailwind CSS** - Utility-first CSS

### Backend
- **FastAPI** - Nowoczesny framework webowy Python
- **Uvicorn** - Serwer ASGI
- **Pydantic** - Walidacja danych
- **httpx** - Asynchroniczny klient HTTP
- **Pillow** - Przetwarzanie obrazów
- **python-jose** - Obsługa JWT
- **RabbitMQ** - Broker komunikatów do przetwarzania kolejek
- **pika** - Klient RabbitMQ dla Python

### Infrastruktura
- **RabbitMQ** - Kolejka komunikatów do asynchronicznego przetwarzania zadań
- **Docker** - Konteneryzacja
- **Caddy** - Serwer webowy dla produkcji

---

## 📋 Wymagania

**System:**
- Node.js 20.19+ lub 22.12+
- Python 3.10+
- RabbitMQ 3.13+
- Docker (opcjonalny, ale zalecany)

**Zależności Backend:**
- FastAPI, Uvicorn, Pydantic, httpx, Pillow, python-jose, passlib, pika

**Zależności Frontend:**
- Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios, Tailwind CSS

---

## 🚀 Szybki Start

### Opcja 1: Docker (Zalecane)

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/dam2452/RanchBotWeb.git
cd RanchBotWeb

# 2. Konfiguracja środowiska
cp .env.example .env
# Edytuj .env z własnymi ustawieniami

# 3. Zbuduj i uruchom wszystkie serwisy (backend, frontend, RabbitMQ, workery)
docker-compose up -d

# Zobacz logi
docker-compose logs -f

# Zatrzymaj serwisy
docker-compose down
```

**Dostęp:**
- Aplikacja: http://localhost:8880
- Backend API: http://localhost:8000
- Zarządzanie RabbitMQ: http://localhost:15672 (guest/guest)

### Opcja 2: Instalacja Manualna

#### Wymagania wstępne
1. Zainstaluj i uruchom RabbitMQ:
```bash
# Ubuntu/Debian
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server

# macOS
brew install rabbitmq
brew services start rabbitmq

# Windows - pobierz z https://www.rabbitmq.com/download.html
```

#### Instalacja

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/dam2452/RanchBotWeb.git
cd RanchBotWeb

# 2. Konfiguracja Backend
cd backend
python -m venv ../.venv
source ../.venv/bin/activate  # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt

# Konfiguracja środowiska
cp .env.example .env
# Edytuj .env z własnymi ustawieniami (w tym dane RabbitMQ)

# 3. Konfiguracja Frontend
cd ../vue-app
npm install
```

#### Uruchamianie

**Terminal 1 - RabbitMQ (jeśli nie działa jako usługa):**
```bash
rabbitmq-server
```

**Terminal 2 - Backend API:**
```bash
cd backend
source ../.venv/bin/activate  # Windows: ..\.venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 3 - Worker Miniatur:**
```bash
cd backend
source ../.venv/bin/activate
python workers/thumbnail_worker.py
```

**Terminal 4 - Worker Dostosowań:**
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

**Dostęp:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Zarządzanie RabbitMQ: http://localhost:15672

---

## 🐳 Wdrożenie Docker

Aplikacja używa Docker Compose z następującymi serwisami:

- **rabbitmq** - Broker komunikatów do asynchronicznego przetwarzania zadań
- **backend** - Serwer aplikacji FastAPI
- **worker-thumbnail** - Worker w tle do generowania miniatur
- **worker-adjustment** - Worker w tle do dostosowywania wideo
- **frontend** - Serwer webowy Caddy serwujący aplikację Vue.js

```bash
# Zbuduj i uruchom wszystkie serwisy (produkcja)
docker-compose up -d

# Zbuduj i uruchom w trybie deweloperskim (eksponuje port backendu 8000)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Zobacz logi konkretnego serwisu
docker-compose logs -f backend
docker-compose logs -f worker-thumbnail
docker-compose logs -f worker-adjustment

# Zrestartuj konkretny serwis
docker-compose restart backend

# Zatrzymaj wszystkie serwisy
docker-compose down

# Przebuduj po zmianach w kodzie
docker-compose up -d --build
```

---

## 📡 Endpointy API

### 🔐 Autentykacja (`/auth`)
- `POST /auth/login` - Zaloguj użytkownika i utwórz sesję
- `GET /auth/logout` - Wyloguj bieżącą sesję
- `POST /auth/logout-all` - Wyloguj ze wszystkich sesji
- `GET /auth/user` - Pobierz informacje o bieżącym użytkowniku

### 🎬 Zarządzanie Klipami (`/clips`)
- `GET /clips?action=get_clips` - Pobierz zapisane klipy użytkownika
- `GET /clips/video/{clip_id}` - Pobierz plik wideo dla konkretnego klipu
- `GET /clips/thumbnail/{clip_id}` - Pobierz miniaturę dla konkretnego klipu
- `POST /clips/save` - Zapisz klip do kolekcji użytkownika
- `POST /clips/delete` - Usuń klip z kolekcji użytkownika

### 🔄 Proxy API (`/api`)
- `POST /api/json` - Proxy żądań JSON API
- `POST /api/video` - Proxy żądań wideo API (zwraca blob)
- `POST /api/thumbnail` - Generuj miniaturę z wideo (asynchronicznie z RabbitMQ)
- `POST /api/adjust-preview` - Dostosuj timing wideo (asynchronicznie z RabbitMQ)
- `POST /api/batch-load` - Równoległe wsadowe ładowanie klipów

### 📚 Dokumentacja API

Ustaw `ENABLE_API_DOCS=True` w `backend/.env` aby uzyskać dostęp:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

---

## 🏗️ Architektura

- **Frontend (Vue 3)** - Interfejs użytkownika na porcie 5173/8880
- **Backend (FastAPI)** - Serwer API na porcie 8000, proxy do zewnętrznego API
- **RabbitMQ** - Kolejka komunikatów do przetwarzania asynchronicznego (miniatury, dostosowania wideo)
- **Workery** - Procesy w tle konsumujące zadania z RabbitMQ
- **Zewnętrzne API (RANCZO_KLIPY)** - Serwis przetwarzania wideo

---

## 🔧 Rozwój

### Rozwój Backend

```bash
cd backend

# Uruchom testy
pytest tests/ -v

# Uruchom konkretny test
pytest tests/test_auth.py -v

# Włącz dokumentację API
echo "ENABLE_API_DOCS=True" >> .env

# Uruchom z hot reload
python -m uvicorn app.main:app --reload
```

### Rozwój Frontend

```bash
cd vue-app

# Sprawdzanie typów
npm run type-check

# Lint i naprawa
npm run lint

# Budowa produkcyjna
npm run build

# Podgląd produkcyjnej budowy
npm run preview
```

### Rozwój Workerów

```bash
cd backend
source ../.venv/bin/activate

# Uruchom thumbnail worker z debugowaniem
PYTHONUNBUFFERED=1 python workers/thumbnail_worker.py

# Uruchom adjustment worker
PYTHONUNBUFFERED=1 python workers/adjustment_worker.py
```

---

## 📝 Zmienne Środowiskowe

### Backend (`.env`)
```env
# RanchBot API
RANCHBOT_API_URL=http://twoj-api-url:8077/api/v1
DEV_JWT_TOKEN=twoj_jwt_token_tutaj

# Sesja i Bezpieczeństwo
SECRET_KEY=twoj-sekretny-klucz-tutaj
SESSION_MAX_AGE=86400

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Serwer
HOST=0.0.0.0
PORT=8000
RELOAD=True
ENABLE_API_DOCS=False  # Ustaw na True dla dokumentacji API

# RabbitMQ
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

### Docker Compose (`.env`)
```env
# RanchBot API
RANCHBOT_API_URL=http://twoj-api-url:8077/api/v1

# Bezpieczeństwo
SECRET_KEY=twoj-sekretny-klucz-tutaj
SESSION_MAX_AGE=86400

# CORS
ALLOWED_ORIGINS=http://localhost:8880

# RabbitMQ
RABBITMQ_USER=guest
RABBITMQ_PASS=guest
```

---

## 🤝 Współpraca

Wkłady są mile widziane! Śmiało przesyłaj Pull Request.

1. Sforkuj repozytorium
2. Utwórz gałąź funkcji (`git checkout -b feature/NowaCecha`)
3. Zatwierdź zmiany (`git commit -m 'Dodaj nową cechę'`)
4. Wypchnij do gałęzi (`git push origin feature/NowaCecha`)
5. Otwórz Pull Request

---

## 📜 Historia Wersji

- **v2.0.5** - Dodano przetwarzanie kolejek RabbitMQ, asynchroniczne generowanie miniatur/dostosowań
- **v2.0.4** - Zoptymalizowane buildy Docker i cache'owanie
- **v2.0.0** - Kompletne przepisanie z Vue.js + FastAPI
- **v1.0.0** - Oryginalna wersja PHP (zarchiwizowana w gałęzi `PHP-v1-Version`)

---

## 📄 Licencja

Ten projekt jest licencjonowany na licencji MIT - zobacz plik [LICENSE](LICENSE) po szczegóły.

---

## 🚀 Dostęp

Zainteresowany używaniem RanchBot Web? Kontakt przez Telegram: [@dam2452](https://t.me/dam2452)

GitHub: [@dam2452](https://github.com/dam2452)

---

## ☕ Wsparcie

Jeśli podoba Ci się ten projekt i chciałbyś wesprzeć jego rozwój, rozważ kupienie mi mamrota!

[![Kup mi Mamrota](Kup_mi_Mamrota.png)](https://buymeacoffee.com/dam2452)
