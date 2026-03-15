# Future Self - Deployment Guide

This repository contains the **Future Self** application, a cinematic Socratic experience.

## Project Structure
- `/frontend`: Vite + React + Tailwind CSS
- `/backend`: Node.js + Express + Google Gemini API

## Quick Deployment

### 1. Backend (Render)
1. Link your GitHub repo to **Render**.
2. Select **Web Service**.
3. Root Directory: `backend`
4. Build Command: `npm install`
5. Start Command: `node server.js`
6. Add Environment Variables:
   - `PORT`: 3001 (Optional, Render handles this)

### 2. Frontend (Vercel)
1. Link your GitHub repo to **Vercel**.
2. Select the `frontend` directory as the project root.
3. Framework Preset: **Vite**.
4. Add Environment Variable:
   - `VITE_API_URL`: Your Render Web Service URL (e.g., `https://your-app.onrender.com`)
5. Deploy.

---

**Note**: Data in `reviews.json` and `stats.json` is ephemeral. For permanent storage, consider migrating to a database like Supabase or MongoDB Atlas in the future.
