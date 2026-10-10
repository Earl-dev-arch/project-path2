const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend assets from parent root directory
app.use(express.static(ROOT_DIR));

// PostgreSQL Connection Pool
let pool = null;
const connectionString = process.env.DATABASE_URL;

if (connectionString) {
  const isCloud = connectionString.includes('neon.tech') || 
                  connectionString.includes('supabase.co') || 
                  connectionString.includes('render.com') || 
                  connectionString.includes('railway.app') ||
                  connectionString.includes('aivencloud.com') ||
                  process.env.PGSSL === 'true';

  pool = new Pool({
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : false
  });

  pool.on('error', (err) => {
    console.error('Unexpected PostgreSQL pool error:', err.message);
  });
} else {
  console.warn('⚠️ No DATABASE_URL found in server/.env. Running with offline/local fallback.');
}

// Auto-initialize PostgreSQL database tables
async function initDb() {
  if (!pool) return;
  try {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          phone VARCHAR(50) DEFAULT '',
          country VARCHAR(100) DEFAULT 'Philippines (+63)',
          grade VARCHAR(100) DEFAULT 'Grade 10',
          age VARCHAR(20) DEFAULT '',
          school VARCHAR(255) DEFAULT '',
          target_country VARCHAR(100) DEFAULT 'Domestic / Home Country',
          budget VARCHAR(100) DEFAULT 'Full scholarship needed',
          goals TEXT DEFAULT '',
          role VARCHAR(50) DEFAULT 'student',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS user_progress (
          user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
          answers JSONB DEFAULT '{}'::jsonb,
          saved_pathways JSONB DEFAULT '[]'::jsonb,
          saved_notes JSONB DEFAULT '{}'::jsonb,
          experiments JSONB DEFAULT '{}'::jsonb,
          session_data JSONB DEFAULT '{}'::jsonb,
          q_index INTEGER DEFAULT 0,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
      `);
      console.log('✅ PostgreSQL tables verified and ready.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('❌ Error initializing PostgreSQL schema:', err.message);
  }
}

initDb();

// Helper to format sanitized user object
function sanitizeUser(u) {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    country: u.country || 'Philippines (+63)',
    grade: u.grade || 'Grade 10',
    age: u.age || '',
    school: u.school || '',
    targetCountry: u.target_country || 'Domestic / Home Country',
    budget: u.budget || 'Full scholarship needed',
    goals: u.goals || '',
    role: u.role || 'student',
    createdAt: u.created_at
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health & Database Check
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  if (pool) {
    try {
      const dbRes = await pool.query('SELECT NOW()');
      if (dbRes.rows.length > 0) dbStatus = 'connected';
    } catch (err) {
      dbStatus = `error: ${err.message}`;
    }
  }
  res.json({
    status: 'ok',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// 2. User Sign Up
app.post('/api/auth/signup', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'Database is not configured. Please set DATABASE_URL in server/.env.' });
  }

  const { email, password, name, phone, country, grade, age, school, targetCountry, budget, goals } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Check if user already exists
    const existing = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user
    const insertUser = await pool.query(`
      INSERT INTO users (
        email, password_hash, name, phone, country, grade, age, school, target_country, budget, goals
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      cleanEmail,
      passwordHash,
      name.trim(),
      phone || '',
      country || 'Philippines (+63)',
      grade || 'Grade 10',
      age || '',
      school || '',
      targetCountry || 'Domestic / Home Country',
      budget || 'Full scholarship needed',
      goals || ''
    ]);

    const newUser = insertUser.rows[0];

    // Initialize progress entry
    await pool.query(`
      INSERT INTO user_progress (user_id, answers, saved_pathways, saved_notes, experiments, session_data, q_index)
      VALUES ($1, '{}'::jsonb, '[]'::jsonb, '{}'::jsonb, '{}'::jsonb, '{}'::jsonb, 0)
      ON CONFLICT (user_id) DO NOTHING
    `, [newUser.id]);

    const sanitized = sanitizeUser(newUser);

    res.status(201).json({
      message: 'Account created successfully',
      user: sanitized,
      progress: {
        answers: {},
        saved: [],
        savedNotes: {},
        experiments: {},
        session: null,
        qIndex: 0
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account. ' + err.message });
  }
});

// 3. User Log In
app.post('/api/auth/login', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'Database is not configured. Please set DATABASE_URL in server/.env.' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const cleanEmail = email.toLowerCase().trim();

  try {
    // Find user by email
    const userRes = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [cleanEmail]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'No account found for that email. Please sign up first.' });
    }

    const user = userRes.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password for this account. Please try again.' });
    }

    // Retrieve user progress
    const progressRes = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [user.id]);
    let progress = {
      answers: {},
      saved: [],
      savedNotes: {},
      experiments: {},
      session: null,
      qIndex: 0
    };

    if (progressRes.rows.length > 0) {
      const p = progressRes.rows[0];
      progress = {
        answers: p.answers || {},
        saved: p.saved_pathways || [],
        savedNotes: p.saved_notes || {},
        experiments: p.experiments || {},
        session: p.session_data || null,
        qIndex: p.q_index || 0
      };
    }

    res.json({
      message: 'Login successful',
      user: sanitizeUser(user),
      progress
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed. ' + err.message });
  }
});

// 4. Save/Sync User Progress
app.post('/api/progress', async (req, res) => {
  if (!pool) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const { userId, email, answers, saved, savedNotes, experiments, session, qIndex } = req.body;

  if (!userId && !email) {
    return res.status(400).json({ error: 'User identification required' });
  }

  try {
    let targetUserId = userId;
    if (!targetUserId && email) {
      const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [email.toLowerCase().trim()]);
      if (u.rows.length > 0) targetUserId = u.rows[0].id;
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    await pool.query(`
      INSERT INTO user_progress (user_id, answers, saved_pathways, saved_notes, experiments, session_data, q_index, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        answers = EXCLUDED.answers,
        saved_pathways = EXCLUDED.saved_pathways,
        saved_notes = EXCLUDED.saved_notes,
        experiments = EXCLUDED.experiments,
        session_data = EXCLUDED.session_data,
        q_index = EXCLUDED.q_index,
        updated_at = NOW()
    `, [
      targetUserId,
      JSON.stringify(answers || {}),
      JSON.stringify(saved || []),
      JSON.stringify(savedNotes || {}),
      JSON.stringify(experiments || {}),
      JSON.stringify(session || {}),
      qIndex || 0
    ]);

    res.json({ success: true, message: 'Progress saved to PostgreSQL' });
  } catch (err) {
    console.error('Progress sync error:', err);
    res.status(500).json({ error: 'Failed to sync progress: ' + err.message });
  }
});

// 5. Fetch User Progress
app.get('/api/progress/:userId', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });

  try {
    const { userId } = req.params;
    const progressRes = await pool.query('SELECT * FROM user_progress WHERE user_id = $1', [userId]);

    if (progressRes.rows.length === 0) {
      return res.json({
        answers: {},
        saved: [],
        savedNotes: {},
        experiments: {},
        session: null,
        qIndex: 0
      });
    }

    const p = progressRes.rows[0];
    res.json({
      answers: p.answers || {},
      saved: p.saved_pathways || [],
      savedNotes: p.saved_notes || {},
      experiments: p.experiments || {},
      session: p.session_data || null,
      qIndex: p.q_index || 0
    });
  } catch (err) {
    console.error('Fetch progress error:', err);
    res.status(500).json({ error: 'Failed to fetch progress: ' + err.message });
  }
});

// 6. Update Profile
app.post('/api/user/profile', async (req, res) => {
  if (!pool) return res.status(503).json({ error: 'Database not configured' });

  const { userId, email, name, phone, country, grade, age, school, targetCountry, budget, goals } = req.body;

  try {
    let targetUserId = userId;
    if (!targetUserId && email) {
      const u = await pool.query('SELECT id FROM users WHERE LOWER(email) = $1', [email.toLowerCase().trim()]);
      if (u.rows.length > 0) targetUserId = u.rows[0].id;
    }

    if (!targetUserId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updated = await pool.query(`
      UPDATE users SET
        name = COALESCE($1, name),
        phone = COALESCE($2, phone),
        country = COALESCE($3, country),
        grade = COALESCE($4, grade),
        age = COALESCE($5, age),
        school = COALESCE($6, school),
        target_country = COALESCE($7, target_country),
        budget = COALESCE($8, budget),
        goals = COALESCE($9, goals),
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [name, phone, country, grade, age, school, targetCountry, budget, goals, targetUserId]);

    if (updated.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: sanitizeUser(updated.rows[0])
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile: ' + err.message });
  }
});

// Fallback for SPA routing - serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Your Path Server is running on port ${PORT}`);
  console.log(`🌐 Local URL: http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${ROOT_DIR}`);
  console.log(`====================================================`);
});

