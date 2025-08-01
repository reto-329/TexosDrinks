// const { Pool } = require('pg');
// require('dotenv').config();

// Add connection validation
// if (!process.env.DB_USER || !process.env.DB_HOST || !process.env.DB_NAME || !process.env.DB_PASSWORD || !process.env.DB_PORT) {
//   console.error('Missing one or more required database environment variables');
// }

// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASSWORD,
//   port: process.env.DB_PORT,
// });

// Test the connection
// pool.query('SELECT NOW()', (err) => {
//   if (err) {
//     console.error('Database connection error:', err.stack);
//   } else {
//     console.log('Database connected successfully');
//   }
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
// };


const { Pool } = require('pg');
require('dotenv').config();

// Validate the DATABASE_URL environment variable
if (!process.env.DATABASE_URL) {
  console.error('Missing DATABASE_URL environment variable');
  process.exit(1); // Exit if no database URL is provided
}

// Parse the DATABASE_URL into connection configuration
const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Required for Supabase SSL connection
  }
});

// Test the connection
pool.query('SELECT NOW()', (err) => {
  if (err) {
    console.error('Database connection error:', err.stack);
    process.exit(1); // Exit if connection fails
  } else {
    console.log('Database connected successfully');
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};