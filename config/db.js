const { Pool } = require('pg');
require('dotenv').config();

// Configuration validation
const requiredEnvVars = ['DATABASE_URL'];
requiredEnvVars.forEach(varName => {
  if (!process.env[varName]) {
    throw new Error(`Missing required environment variable: ${varName}`);
  }
});

// Enhanced connection pool configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  
  // SSL configuration (Render requires SSL)
  ssl: {
    rejectUnauthorized: true, // Validate Render's certificate
    ca: process.env.DB_CA_CERT // Optional: Add if you have custom CA
  },
  
  // Connection tuning
  connectionTimeoutMillis: 5000,    // 5s connection timeout
  idleTimeoutMillis: 30000,         // Close idle clients after 30s
  max: 20,                          // Max clients in pool
  min: 2,                           // Minimum idle clients
  allowExitOnIdle: false,           // Don't allow process exit with active connections
  
  // Query timeouts (safety against long-running queries)
  statement_timeout: 10000,        // 10s per statement
  query_timeout: 30000             // 30s per query
});

// Enhanced connection test with health checks
async function verifyDatabaseConnection() {
  const client = await pool.connect();
  try {
    // Basic connection test
    const pingResult = await client.query('SELECT NOW() as db_time, pg_database_size(current_database()) as db_size');
    console.log('Database connection verified at:', pingResult.rows[0].db_time);
    
    // Additional health checks
    const healthResult = await client.query(`
      SELECT 
        (SELECT count(*) FROM pg_stat_activity) as active_connections,
        (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections
    `);
    
    console.log('Database health:', {
      activeConnections: healthResult.rows[0].active_connections,
      maxConnections: healthResult.rows[0].max_connections,
      databaseSize: formatBytes(pingResult.rows[0].db_size)
    });
    
    return true;
  } finally {
    client.release();
  }
}

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

// Connection lifecycle management
let isShuttingDown = false;

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log('Received SIGTERM. Closing database pool...');
  try {
    await pool.end();
    console.log('Database pool closed gracefully');
    process.exit(0);
  } catch (err) {
    console.error('Error closing database pool:', err);
    process.exit(1);
  }
});

// Periodic connection validation (optional)
setInterval(async () => {
  try {
    await verifyDatabaseConnection();
  } catch (err) {
    console.error('Periodic connection check failed:', err.message);
  }
}, 300000); // Every 5 minutes

// Initial connection verification
verifyDatabaseConnection()
  .catch(err => {
    console.error('Fatal database connection error:', err);
    process.exit(1);
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
  getClient: () => pool.connect(),
  pool,
  verifyDatabaseConnection
};
