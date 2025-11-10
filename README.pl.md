# 🎬 RanchBot Web

Nowoczesna aplikacja webowa do wyszukiwania i tworzenia klipów wideo z popularnego polskiego serialu "Ranczo".

**To jest interfejs webowy dla [RANCZO_KLIPY API](https://github.com/dam2452/RANCZO_KLIPY)**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vue 3](https://img.shields.io/badge/Vue-3.5-brightgreen.svg)](https://vuejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)

---

## 🇬🇧 English Version

For English documentation, see [README.md](README.md).

---

## 📺 Demo

### 🖥️ Wersja Desktopowa
> 🎥 [Wkrótce - wideo demo dla PC]

### 📱 Wersja Mobilna
> 🎥 [Wkrótce - wideo demo dla telefonu]

### 📸 Zrzuty ekranu

<table>
  <tr>
    <td align="center">
      <img src="screenshots/desktop-home.png" alt="Desktop Home" width="400"/><br/>
      <sub><b>Desktop - Strona główna</b></sub>
    </td>
    <td align="center">
      <img src="screenshots/mobile-search.png" alt="Mobile Search" width="200"/><br/>
      <sub><b>Mobile - Wyszukiwanie</b></sub>
    </td>
  </tr>
  <tr>
    <td align="center">
      <img src="screenshots/desktop-clips.png" alt="Desktop Clips" width="400"/><br/>
      <sub><b>Desktop - Zapisane klipy</b></sub>
    </td>
    <td align="center">
      <img src="screenshots/mobile-player.png" alt="Mobile Player" width="200"/><br/>
      <sub><b>Mobile - Odtwarzacz</b></sub>
    </td>
  </tr>
</table>

> 📁 Dodaj swoje screenshoty do katalogu `screenshots/`

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

---

## 📋 Wymagania

**System:**
- Node.js 20.19+ lub 22.12+
- Python 3.10+
- Docker (opcjonalnie)

**Zależności Backend:**
- FastAPI, Uvicorn, Pydantic, httpx, Pillow, python-jose, passlib

**Zależności Frontend:**
- Vue 3, TypeScript, Vite, Pinia, Vue Router, Axios, Tailwind CSS

---

## 🚀 Szybki Start

### Instalacja

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/dam2452/RanchBotWeb.git
cd RanchBotWeb

# 2. Konfiguracja Backendu
cd backend
python -m venv ../.venv
source ../.venv/bin/activate  # Windows: ..\.venv\Scripts\activate
pip install -r requirements.txt

# Skonfiguruj środowisko
cp .env.example .env
# Edytuj .env z własnymi ustawieniami

# 3. Konfiguracja Frontendu
cd ../vue-app
npm install
```

### Uruchamianie

**Terminal 1 - Backend:**
```bash
cd backend
source ../.venv/bin/activate  # Windows: ..\.venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd vue-app
npm run dev
```

**Dostęp:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Dokumentacja API: http://localhost:8000/docs

---

## 🐳 Wdrożenie Docker

```bash
# Zbuduj i uruchom wszystkie usługi
docker-compose up -d

# Zobacz logi
docker-compose logs -f

# Zatrzymaj usługi
docker-compose down
```

---

## 📡 Endpointy API

### 🔐 Autentykacja (`/auth`)
- `POST /auth/login` - Logowanie użytkownika i utworzenie sesji
- `GET /auth/logout` - Wylogowanie z bieżącej sesji
- `POST /auth/logout-all` - Wylogowanie ze wszystkich sesji
- `GET /auth/user` - Pobierz informacje o bieżącym użytkowniku

### 🎬 Zarządzanie Klipami (`/clips`)
- `GET /clips?action=get_clips` - Pobierz zapisane klipy użytkownika
- `GET /clips/video/{clip_id}` - Pobierz plik wideo dla konkretnego klipu
- `GET /clips/thumbnail/{clip_id}` - Pobierz miniaturę dla konkretnego klipu

### 🔄 Proxy API (`/api`)
- `POST /api/json` - Przekaż żądania JSON API
- `POST /api/video` - Przekaż żądania wideo API (zwraca blob)
- `POST /api/thumbnail` - Wygeneruj miniaturę z wideo

Pełna dokumentacja API dostępna pod adresem http://localhost:8000/docs po uruchomieniu backendu.

---

## 🏗️ Architektura

Aplikacja wykorzystuje architekturę trójwarstwową:

1. **Warstwa Frontendowa (Vue 3)** - Interfejs użytkownika działający na porcie 5173
   - Obsługuje całe renderowanie UI i interakcje użytkownika
   - Zarządza stanem po stronie klienta za pomocą Pinia
   - Komunikuje się z backendem przez Axios używając ciasteczek sesji

2. **Warstwa Backendowa (FastAPI)** - Serwer API działający na porcie 8000
   - Obsługuje autentykację i zarządzanie sesjami
   - Przekazuje żądania do zewnętrznego API RanchBot
   - Zarządza cache'owaniem miniatur i przetwarzaniem obrazów
   - Waliduje żądania i obsługuje logikę biznesową

3. **Zewnętrzne API (RANCZO_KLIPY)** - Usługa przetwarzania wideo
   - Zapewnia funkcjonalność wyszukiwania cytatów
   - Generuje i przechowuje klipy wideo
   - Zarządza kolekcjami klipów użytkowników

Frontend i backend komunikują się przez HTTP z autentykacją opartą na sesjach, podczas gdy backend komunikuje się z zewnętrznym API używając tokenów JWT.

Zobacz [backend/README.md](backend/README.md) i [vue-app/README.md](vue-app/README.md) dla szczegółowej dokumentacji komponentów.

---

## 🔧 Rozwój

### Rozwój Backendu

```bash
cd backend

# Uruchom testy
pytest tests/ -v

# Uruchom konkretny test
pytest tests/test_auth.py -v
```

Zobacz [backend/README.md](backend/README.md) dla więcej szczegółów.

### Rozwój Frontendu

```bash
cd vue-app

# Sprawdzanie typów
npm run type-check

# Linting i naprawa
npm run lint

# Build produkcyjny
npm run build
```

Zobacz [vue-app/README.md](vue-app/README.md) dla więcej szczegółów.

---

## 📝 Zmienne Środowiskowe

### Backend (`.env`)
```env
RANCHBOT_API_URL=http://your-api-url:8077
SECRET_KEY=your-secret-key-here
SESSION_MAX_AGE=86400
CORS_ORIGINS=["http://localhost:5173"]
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:8000
```

---

## 🤝 Współpraca

Wkład jest mile widziany! Zapraszamy do przesyłania Pull Requestów.

1. Zforkuj repozytorium
2. Utwórz branch dla swojej funkcji (`git checkout -b feature/NowaFunkcja`)
3. Zatwierdź swoje zmiany (`git commit -m 'Dodaj nową funkcję'`)
4. Wypchnij do brancha (`git push origin feature/NowaFunkcja`)
5. Otwórz Pull Request

---

## 📜 Historia Wersji

- **v2.0.4** - Najnowsze obrazy Docker z optymalizacjami
- **v2.0.0** - Kompletne przepisanie z Vue.js + FastAPI
- **v1.0.0** - Oryginalna wersja PHP (zarchiwizowana w branchu `PHP-v1-Version`)

---

## 📄 Licencja

Ten projekt jest objęty licencją MIT - zobacz plik [LICENSE](LICENSE) dla szczegółów.

---

## 🚀 Dostęp

Zainteresowany używaniem RanchBot Web? Skontaktuj się przez Telegram: [@dam2452](https://t.me/dam2452)

GitHub: [@dam2452](https://github.com/dam2452)

---

## ☕ Wsparcie

Jeśli podoba Ci się ten projekt i chciałbyś wesprzeć jego rozwój, rozważ postawienie mi mamrota!

[![Kup mi Mamrota](Kup_mi_Mamrota.png)](https://buymeacoffee.com/dam2452)


