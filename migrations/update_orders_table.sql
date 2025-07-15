-- Add address_id and status columns to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS address_id INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Add foreign key constraint if address_book table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'address_book') THEN
        ALTER TABLE orders ADD CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES address_book(id);
    END IF;
END
$$;