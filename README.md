# E-Book Platform Monorepo 📚✨

> **Politeknik Besut Academic E-Book Platform**  
> **Lecturer Project Team**: Farah Hayati Binti Che Lah (`farah@polibesut.edu.my`) • Wan Izyani Binti Wan Jusoh (`izyani@polibesut.edu.my`) • Wee Siew Ping (`wee@polibesut.edu.my`)  
> **Institution**: Politeknik Besut, Terengganu  

---

## 📁 Repository Structure

This repository is organized as a clean **Monorepo** containing both the backend and frontend:

```
ebook/
├── backend/       # Laravel 11 PHP REST API + Google Gemini AI Service + MySQL
├── frontend/      # React 19 + TypeScript + Tailwind CSS + FlipBook Engine
├── package.json   # Root workspace script to run both simultaneously
└── README.md
```

---

## 🚀 Quick Start (1-Command Dev Server)

Inside the `ebook` folder, you can run both servers together:

```bash
# 1. Install root, backend, and frontend packages
npm install
cd backend && composer install && cd ..
cd frontend && npm install && cd ..

# 2. Run both Backend (:8001) and Frontend (:5173) simultaneously:
npm run dev
```

---

## 🌐 Publishing / Deployment Guide

When you publish to GitHub, push this entire `ebook` folder as **1 single repository**.

### Free Cloud Deployment Options:
1. **Frontend (`ebook/frontend`)**:
   - Host on **[Vercel](https://vercel.com)** or **[Netlify](https://netlify.com)** (Free).
   - Set Root Directory to `frontend`.
   - Set Environment Variable: `VITE_API_URL=https://your-backend-url/api`.

2. **Backend (`ebook/backend`)**:
   - Host on **[Railway](https://railway.app)**, **[Render](https://render.com)**, or your own **VPS / cPanel**.
   - Set Root Directory to `backend`.
   - Set `.env` database credentials and `GEMINI_API_KEY`.
