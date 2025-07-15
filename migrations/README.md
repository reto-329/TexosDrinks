# Database Migrations

This directory contains database migration scripts for the TexosDrinks application.

## Available Migrations

1. `update_orders_table.sql` - Adds `address_id` and `status` columns to the `orders` table
2. `create_transactions_table.sql` - Creates the `transactions` table for Paystack payment integration

## Running Migrations

To run all migrations at once:

```bash
node migrations/runAllMigrations.js
```

To run individual migrations:

```bash
# Run orders table update
node migrations/runMigration.js

# Run transactions table creation (not implemented separately)
```

## Migration Order

Migrations should be run in the following order:

1. Update orders table
2. Create transactions table

This ensures that all required tables and columns exist before creating foreign key relationships.