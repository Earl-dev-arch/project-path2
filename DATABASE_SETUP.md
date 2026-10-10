# 🌐 PostgreSQL Multi-Device Setup Guide

This guide walks you through connecting your **Your Path** application to a **100% free PostgreSQL database** in less than 2 minutes.

Once connected:
- Any student account created on one device (e.g., phone, laptop, school computer) can immediately log in on any other device.
- All questionnaire progress, answers, saved pathways, notes, and experiments will be safely saved in the cloud and synced across all devices.

---

## Folder Structure

All backend and database files are organized in the [`server/`](file:///server/) folder:

```text
project-path2/
├── server/
│   ├── .env               <- Paste your PostgreSQL connection URL here
│   ├── .env.example       <- Example connection URL template
│   ├── server.js          <- Express + PostgreSQL backend API
│   ├── schema.sql         <- PostgreSQL database schema
│   └── package.json       <- Server dependencies
├── index.html             <- Web application frontend
├── styles.css             <- Stylesheets
├── app_scratch.js         <- App logic & cloud sync adapter
└── DATABASE_SETUP.md      <- Setup documentation
```

---

## Step 1: Get a 100% Free PostgreSQL Database (Takes ~30 Seconds)

You can use **Neon** (or Supabase, Render, Aiven) which provides a free managed PostgreSQL database with **no credit card required**:

1. Go to [https://neon.tech](https://neon.tech) and sign up (or sign in with GitHub/Google).
2. Click **Create Project** (e.g., name it `your-path-db`).
3. Neon will instantly display your **Connection String / URI**. It looks like this:
   ```text
   postgresql://neondb_owner:npg_xxxxxxxx@ep-sweet-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Click **Copy** to copy the connection string.

---

## Step 2: Add the Database URL to `server/.env`

Open the [`server/.env`](file:///server/.env) file and paste your connection string:

```env
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sweet-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
PORT=3000
```

---

## Step 3: Install Dependencies & Start the Server

1. Open your terminal in the project directory.
2. Install the necessary packages:
   ```bash
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```

> [!NOTE]
> The server will **automatically initialize the PostgreSQL tables** (`users` and `user_progress`) on startup. You do not need to run SQL migrations manually!

---

## Step 4: Access Your App from Any Device

- **On your local computer:** Open `http://localhost:3000`
- **On other devices on the same Wi-Fi:** Open `http://<your-computer-ip>:3000` (e.g. `http://192.168.1.100:3000`)
- **Deploying online (Free 24/7 Hosting):** You can deploy this app to [Render](https://render.com), [Railway](https://railway.app), or [Vercel](https://vercel.com) by setting `DATABASE_URL` in their environment variable settings.

---

## Database Schema Reference

The tables created automatically in your PostgreSQL database:

```sql
-- 1. Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  country VARCHAR(100),
  grade VARCHAR(100),
  age VARCHAR(20),
  school VARCHAR(255),
  target_country VARCHAR(100),
  budget VARCHAR(100),
  goals TEXT,
  role VARCHAR(50) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. User Progress Table (Cross-device answers & saved progress)
CREATE TABLE user_progress (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  answers JSONB DEFAULT '{}'::jsonb,
  saved_pathways JSONB DEFAULT '[]'::jsonb,
  saved_notes JSONB DEFAULT '{}'::jsonb,
  experiments JSONB DEFAULT '{}'::jsonb,
  session_data JSONB DEFAULT '{}'::jsonb,
  q_index INTEGER DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```
