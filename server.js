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
    
    // FIXED: Use the correct syntax for parameterized queries
    // For Neon serverless driver, we need to use tagged templates or .query()
    
    let result;
    
    if (params && params.length > 0) {
      // Method 1: Use .query() for traditional parameterized queries
      result = await sql.query(queryText, params);
    } else {
      // Method 2: Use tagged template literal for simple queries
      result = await sql(queryText);
    }
    
    res.json({ rows: result });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test database connection endpoint
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await sql`SELECT NOW() as current_time`;
    res.json({ 
      success: true, 
      message: 'Database connected successfully!', 
      data: result 
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Get all notices
app.get('/api/notices', async (req, res) => {
  try {
    const notices = await sql`SELECT * FROM notices ORDER BY created_at DESC`;
    res.json(notices);
  } catch (error) {
    console.error('Error fetching notices:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add a notice
app.post('/api/notices', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Notice text is required' });
    }
    
    const result = await sql`INSERT INTO notices (text) VALUES (${text}) RETURNING *`;
    res.json(result[0]);
  } catch (error) {
    console.error('Error adding notice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a notice
app.delete('/api/notices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM notices WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting notice:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get banner
app.get('/api/banner', async (req, res) => {
  try {
    const banner = await sql`SELECT * FROM banner WHERE id = 1`;
    res.json(banner[0] || {});
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update banner
app.post('/api/banner', async (req, res) => {
  try {
    const { image_url } = req.body;
    const result = await sql`
      UPDATE banner 
      SET image_url = ${image_url}, updated_at = CURRENT_TIMESTAMP 
      WHERE id = 1 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get school images
app.get('/api/school-images', async (req, res) => {
  try {
    const images = await sql`SELECT * FROM school_images WHERE id = 1`;
    res.json(images[0] || {});
  } catch (error) {
    console.error('Error fetching school images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update school images
app.post('/api/school-images', async (req, res) => {
  try {
    const { school_image, principal_image, contact_image } = req.body;
    
    // Build the update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (school_image !== undefined) {
      updates.push(`school_image = $${paramIndex++}`);
      values.push(school_image);
    }
    if (principal_image !== undefined) {
      updates.push(`principal_image = $${paramIndex++}`);
      values.push(principal_image);
    }
    if (contact_image !== undefined) {
      updates.push(`contact_image = $${paramIndex++}`);
      values.push(contact_image);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (updates.length > 1) {
      const query = `
        UPDATE school_images 
        SET ${updates.join(', ')} 
        WHERE id = 1 
        RETURNING *
      `;
      
      const result = await sql.query(query, values);
      res.json(result[0]);
    } else {
      const current = await sql`SELECT * FROM school_images WHERE id = 1`;
      res.json(current[0]);
    }
  } catch (error) {
    console.error('Error updating school images:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get gallery images
app.get('/api/gallery', async (req, res) => {
  try {
    const images = await sql`SELECT * FROM gallery ORDER BY created_at DESC`;
    res.json(images);
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add gallery image
app.post('/api/gallery', async (req, res) => {
  try {
    const { image_url, file_name } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const result = await sql`
      INSERT INTO gallery (image_url, file_name) 
      VALUES (${image_url}, ${file_name}) 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error adding gallery image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete gallery image
app.delete('/api/gallery/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM gallery WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting gallery image:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get facilities
app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await sql`SELECT * FROM facilities ORDER BY created_at DESC`;
    res.json(facilities);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add facility
app.post('/api/facilities', async (req, res) => {
  try {
    const { image_url, title, description, file_name } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const result = await sql`
      INSERT INTO facilities (image_url, title, description, file_name) 
      VALUES (${image_url}, ${title}, ${description}, ${file_name}) 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error adding facility:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update facility
app.put('/api/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, title, description, file_name } = req.body;
    
    const result = await sql`
      UPDATE facilities 
      SET image_url = ${image_url}, title = ${title}, description = ${description}, file_name = ${file_name}
      WHERE id = ${id} 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating facility:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete facility
app.delete('/api/facilities/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM facilities WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting facility:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get achievements
app.get('/api/achievements', async (req, res) => {
  try {
    const achievements = await sql`SELECT * FROM achievements ORDER BY created_at DESC`;
    res.json(achievements);
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: error.message });
  }
});

// Add achievement
app.post('/api/achievements', async (req, res) => {
  try {
    const { image_url, title, description, file_name } = req.body;
    if (!image_url) {
      return res.status(400).json({ error: 'Image URL is required' });
    }
    
    const result = await sql`
      INSERT INTO achievements (image_url, title, description, file_name) 
      VALUES (${image_url}, ${title}, ${description}, ${file_name}) 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error adding achievement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update achievement
app.put('/api/achievements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { image_url, title, description, file_name } = req.body;
    
    const result = await sql`
      UPDATE achievements 
      SET image_url = ${image_url}, title = ${title}, description = ${description}, file_name = ${file_name}
      WHERE id = ${id} 
      RETURNING *
    `;
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating achievement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete achievement
app.delete('/api/achievements/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await sql`DELETE FROM achievements WHERE id = ${id}`;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting achievement:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get downloads
app.get('/api/downloads', async (req, res) => {
  try {
    const downloads = await sql`SELECT * FROM downloads WHERE id = 1`;
    res.json(downloads[0] || {});
  } catch (error) {
    console.error('Error fetching downloads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update downloads
app.post('/api/downloads', async (req, res) => {
  try {
    const { admission_url, admission_name, prospectus_url, prospectus_name } = req.body;
    
    // Build the update query dynamically
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    if (admission_url !== undefined) {
      updates.push(`admission_url = $${paramIndex++}`);
      values.push(admission_url);
    }
    if (admission_name !== undefined) {
      updates.push(`admission_name = $${paramIndex++}`);
      values.push(admission_name);
    }
    if (prospectus_url !== undefined) {
      updates.push(`prospectus_url = $${paramIndex++}`);
      values.push(prospectus_url);
    }
    if (prospectus_name !== undefined) {
      updates.push(`prospectus_name = $${paramIndex++}`);
      values.push(prospectus_name);
    }
    
    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    
    if (updates.length > 1) {
      const query = `
        UPDATE downloads 
        SET ${updates.join(', ')} 
        WHERE id = 1 
        RETURNING *
      `;
      
      const result = await sql.query(query, values);
      res.json(result[0]);
    } else {
      const current = await sql`SELECT * FROM downloads WHERE id = 1`;
      res.json(current[0]);
    }
  } catch (error) {
    console.error('Error updating downloads:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get popup data
app.get('/api/popup', async (req, res) => {
  try {
    const popup = await sql`SELECT * FROM popup WHERE id = 1`;
    res.json(popup[0] || {});
  } catch (error) {
    console.error('Error fetching popup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update popup data
app.post('/api/popup', async (req, res) => {
  try {
    const { title, subtitle, footer, cards } = req.body;
    
    // Check if record exists
    const existing = await sql`SELECT * FROM popup WHERE id = 1`;
    
    let result;
    if (existing.length > 0) {
      // Update existing
      result = await sql`
        UPDATE popup 
        SET title = ${title}, subtitle = ${subtitle}, footer = ${footer}, cards = ${cards}, updated_at = CURRENT_TIMESTAMP
        WHERE id = 1 
        RETURNING *
      `;
    } else {
      // Insert new
      result = await sql`
        INSERT INTO popup (id, title, subtitle, footer, cards) 
        VALUES (1, ${title}, ${subtitle}, ${footer}, ${cards}) 
        RETURNING *
      `;
    }
    
    res.json(result[0]);
  } catch (error) {
    console.error('Error updating popup:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  initDatabase();
});