# Deployment Guide: AI Placement Preparation Platform

This guide covers how to deploy the Frontend to **Vercel** and the Backend to **Render** for a production-ready setup.

## 1. Backend Deployment (Render)

Render is great for hosting Node.js + Express backend services.

### Prerequisites
1. Push your `phase3-backend` code to a GitHub repository.
2. Sign up / Log in to [Render](https://render.com).

### Steps
1. In your Render Dashboard, click **New +** and select **Web Service**.
2. Connect your GitHub account and select the repository containing your backend.
3. Configure the Web Service:
   - **Name:** e.g., `ai-placement-backend`
   - **Root Directory:** `phase3-backend` (or leave empty if it's a standalone repo)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. **Environment Variables** (Add under "Advanced" -> "Environment Variables"):
   - `MONGO_URI`: Your MongoDB connection string (e.g., from MongoDB Atlas)
   - `GEMINI_API_KEY`: Your Google Gemini API Key (from Google AI Studio)
   - `JWT_SECRET`: A strong random string for signing JWT tokens (e.g., `super_secret_production_key_123`)
   - `PORT`: (Optional, Render assigns one automatically, but you can set to `5000`)
5. Click **Create Web Service**.
6. Once deployed, Render will provide a URL (e.g., `https://ai-placement-backend.onrender.com`). Copy this!

---

## 2. Frontend Deployment (Vercel)

Vercel is optimized for React/Vite applications.

### Prerequisites
1. Change your frontend code to point to the production backend URL.
   Open `phase2-react/src/utils/api.js` and change `API_URL`:
   ```javascript
   // Change from localhost to your Render URL
   export const API_URL = 'https://ai-placement-backend.onrender.com/api';
   ```
2. Push your `phase2-react` code to a GitHub repository.
3. Sign up / Log in to [Vercel](https://vercel.com).

### Steps
1. In your Vercel Dashboard, click **Add New** -> **Project**.
2. Import the GitHub repository containing your frontend.
3. Configure the Project:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `phase2-react` (if it's in a monorepo)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**.
5. Once your build finishes, Vercel will give you a live production link!

---

## Post-Deployment Checklist
- [ ] Create a user account on your live frontend.
- [ ] Check if the Backend receives the login requests (use Render Logs).
- [ ] Test the Interview Simulator. Make sure your local Judge0 RapidAPI Key is provided in the simulator interface.

**Your Premium Platform is now Live! 🚀**
