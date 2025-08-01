const { Pool } = require('pg');
require('dotenv').config();

// Validate environment configuration
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Database pool configuration with no timeouts
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Render's self-signed certificates
  },
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 0, // Disable idle connection timeout
  connectionTimeoutMillis: 0, // Disable connection establishment timeout
  query_timeout: 0, // Disable query timeout
  statement_timeout: 0 // Disable statement timeout
});

// Basic connection test function
async function testConnection() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT NOW()');
    console.log('Database connected at:', res.rows[0].now);
    return true;
  } finally {
    client.release();
  }
}

// Robust connection test with infinite retries and exponential backoff
async function testConnectionWithInfiniteRetry() {
  let attempt = 0;
  const maxDelay = 30000; // Maximum delay between retries (30 seconds)
  
  while (true) {
    try {
      await testConnection();
      console.log('Database connection established successfully');
      return;
    } catch (err) {
      attempt++;
      const delay = Math.min(1000 * Math.pow(2, attempt), maxDelay);
      
      console.error(`Connection attempt ${attempt} failed:`, err.message);
      console.log(`Retrying in ${delay/1000} seconds...`);
      
      // Wait with exponential backoff before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Start connection testing
testConnectionWithInfiniteRetry()
  .catch(err => {
    console.error('Fatal database connection error:', err);
    process.exit(1);
  });

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('Received termination signal - closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error closing database pool:', err);
    process.exit(1);
  }
});

// Export database interface
module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool
};
