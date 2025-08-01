// db.js (CommonJS)
const { Pool } = require('pg');
require('dotenv').config();

// Validate environment variables
const requiredVars = ['DB_USER', 'DB_HOST', 'DB_NAME', 'DB_PASSWORD', 'DB_PORT'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  throw new Error(`Missing database config: ${missingVars.join(', ')}`);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
    `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// Enhanced connection test
pool.on('connect', () => console.log('New client connected'));
pool.on('error', err => console.error('Pool error:', err));

async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('Database connected at:', res.rows[0].now);
  } finally {
    client.release();
  }
}

testConnection().catch(err => console.error('Connection test failed:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  sql: pool // For compatibility with both approaches
};