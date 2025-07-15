require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

async function runMigrations() {
  try {
    // Read the SQL files
    const updateOrdersSQL = fs.readFileSync(
      path.join(__dirname, 'update_orders_table.sql'),
      'utf8'
    );
    
    const createTransactionsSQL = fs.readFileSync(
      path.join(__dirname, 'create_transactions_table.sql'),
      'utf8'
    );
    
    const createOrderStatusSQL = fs.readFileSync(
      path.join(__dirname, 'create_order_status_table.sql'),
      'utf8'
    );
    
    // Execute the SQL in order
    console.log('Running orders table update...');
    await db.query(updateOrdersSQL);
    console.log('Orders table update completed successfully');
    
    console.log('Running transactions table creation...');
    await db.query(createTransactionsSQL);
    console.log('Transactions table creation completed successfully');
    
    console.log('Running order status table creation...');
    await db.query(createOrderStatusSQL);
    console.log('Order status table creation completed successfully');
    
    console.log('All migrations completed successfully');
  } catch (err) {
    console.error('Migration error:', err);
  }
}

runMigrations();