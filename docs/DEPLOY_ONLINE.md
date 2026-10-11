# 🚀 How to Host Your Path Online for Free (Public 24/7 Access)

To let anyone in the world access your website from any device (phones, computers, tablets), you can host it online for **100% free**.

---

## Method 1: Render.com (Recommended - Permanent Free 24/7 HTTPS URL)

**Render** gives you a free public web address (e.g. `https://your-path.onrender.com`) with automated deployment and free SSL.

### Step-by-Step:

1. **Push your code to GitHub:**
   - Create a GitHub repository (e.g., `your-path-app`).
   - Push your project code to GitHub.

2. **Sign up on Render:**
   - Go to [https://render.com](https://render.com) and log in with your GitHub account.

3. **Create a New Web Service:**
   - Click **New +** -> **Web Service**.
   - Select your `your-path-app` GitHub repository.
   - Configure the settings:
     - **Name:** `your-path` (or any name you choose)
     - **Runtime:** `Node`
     - **Build Command:** `npm install`
     - **Start Command:** `node server/server.js`
     - **Instance Type:** `Free`

4. **Add your PostgreSQL Database URL:**
   - Scroll to **Environment Variables**.
   - Add a new variable:
     - **Key:** `DATABASE_URL`
     - **Value:** *(Paste your PostgreSQL connection string from `server/.env`)*

5. **Click "Deploy Web Service"**:
   - Render will build your site and give you a live public link:
   - `https://your-path.onrender.com`

---

## Method 2: Instant Public Link without GitHub (Cloudflare Tunnel / Localtunnel)

If you want to share a live HTTPS link with friends or test across phones immediately without pushing to GitHub first:

1. In your project terminal, run:
   ```bash
   npx localtunnel --port 3000
   ```
2. It will instantly generate a public web link like:
   ```text
   https://sweet-badger-22.loca.lt
   ```
3. Anyone with that link can open your website, create an account, and sync progress on their devices while your server is running.

