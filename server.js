// server.js
const express = require('express');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // For base64 images

// Database connection
const sql = neon(process.env.DATABASE_URL);

// ========== INITIALIZE DATABASE TABLES ==========
async function initDatabase() {
  try {
    // Create tables if they don't exist
    await sql`
      CREATE TABLE IF NOT EXISTS notices (
        id SERIAL PRIMARY KEY,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS banner (
        id INTEGER PRIMARY KEY DEFAULT 1,
        image_url TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS school_images (
        id INTEGER PRIMARY KEY DEFAULT 1,
        school_image TEXT,
        principal_image TEXT,
        contact_image TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS gallery (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        file_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS facilities (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        file_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS achievements (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        file_name TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS downloads (
        id INTEGER PRIMARY KEY DEFAULT 1,
        admission_url TEXT,
        admission_name TEXT,
        prospectus_url TEXT,
        prospectus_name TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    await sql`
      CREATE TABLE IF NOT EXISTS popup (
        id INTEGER PRIMARY KEY DEFAULT 1,
        title TEXT,
        subtitle TEXT,
        footer TEXT,
        cards JSONB,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    
    // Insert default records
    await sql`
      INSERT INTO banner (id, image_url) 
      VALUES (1, 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80') 
      ON CONFLICT (id) DO NOTHING;
    `;
    
    await sql`
      INSERT INTO school_images (id, school_image, principal_image, contact_image) 
      VALUES (1, 
        'https://images.unsplash.com/photo-1580582932707-520aed937b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1932&q=80',
        'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
      ) ON CONFLICT (id) DO NOTHING;
    `;
    
    await sql`
      INSERT INTO downloads (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    `;
    
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// ========== API ENDPOINTS ==========

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'API is running', message: 'Daffodils School API' });
});

// Generic query endpoint (used by frontend)
app.post('/api/query', async (req, res) => {
  try {
    const { sql: queryText, params } = req.body;
    
    if (!queryText) {
      return res.status(400).json({ error: 'SQL query is required' });
    }
    
    // Execute query with parameters
    const result = await sql(queryText, params || []);
    res.json({ rows: result });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initDatabase();
});