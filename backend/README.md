# FlipBook Platform • Interactive E-Book Suite 📖✨

> **Developed by Hafizul Irfan • Student DIT, Politeknik Besut**  
> An open-source, ad-free interactive 3D digital publishing and flipbook platform with AI quizzes, YouTube video lessons, and device-session persistence.

---

## 🏗️ Unified Full-Stack Architecture

This repository contains both the **Laravel 11 Backend** and the **React 19 + Vite Frontend** unified inside a single folder.

```
backend/
├── app/                  # Laravel API, Models, Controllers & GeminiService
├── database/             # MySQL Migrations & Seeders
├── routes/               # API & Web SPA routes
├── public/               # Public web root & compiled React build (public/dist/)
├── src/                  # React 19 + TypeScript + Tailwind CSS Frontend
├── index.html            # Frontend HTML entry point
├── package.json          # Frontend packages & build scripts
├── composer.json         # Laravel PHP dependencies
├── vite.config.ts        # Vite configuration & dev proxy
└── .env                  # Single unified environment file
```

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
composer install
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` (or use existing `.env`):
```env
DB_CONNECTION=mysql
DB_DATABASE=ebook_platform
DB_USERNAME=root
DB_PASSWORD=

# (Optional) Google AI Studio Gemini API Key
GEMINI_API_KEY=AIzaSy...
```

### 3. Run Migrations & Storage Link
```bash
php artisan migrate
php artisan storage:link
```

### 4. Start Development Servers
- **Backend API Server**:
  ```bash
  php artisan serve --port=8001
  ```
- **Frontend Dev Server (with Hot Reload)**:
  ```bash
  npm run dev
  ```
  Open **http://localhost:5173** in your browser.

---

## 🌐 Production Deployment (1-Command Build)

To build and serve the entire full-stack app from Laravel on a single domain (e.g. cPanel, VPS, or Laragon):

```bash
npm run build
```

The compiled React frontend is placed into `public/dist/`. Laravel automatically serves both the frontend on `/` and the REST API on `/api/...` with **zero CORS configuration needed**!
