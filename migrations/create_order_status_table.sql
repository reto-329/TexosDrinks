-- Create order_status table
CREATE TABLE IF NOT EXISTS order_status (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default status values
INSERT INTO order_status (name, description) VALUES
('pending', 'Order created but payment not initiated'),
('processing', 'Payment initiated but not confirmed'),
('paid', 'Payment successfully verified'),
('fulfilled', 'Order shipped/delivered'),
('cancelled', 'Order cancelled'),
('refunded', 'Payment refunded')
ON CONFLICT (name) DO NOTHING;

-- Update orders table to reference order_status
ALTER TABLE orders ADD COLUMN IF NOT EXISTS status_id INTEGER;
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_status;
ALTER TABLE orders ADD CONSTRAINT fk_orders_status FOREIGN KEY (status_id) REFERENCES order_status(id);

-- Update existing orders with default status (pending)
UPDATE orders SET status_id = (SELECT id FROM order_status WHERE name = 'pending')
WHERE status_id IS NULL;