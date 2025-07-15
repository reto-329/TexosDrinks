CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default delivery settings
INSERT INTO settings (key, value, description) 
VALUES 
('FREE_DELIVERY_THRESHOLD', '100000', 'Minimum order amount for free delivery (in Naira)'),
('DELIVERY_FEE', '0', 'Standard delivery fee (in Naira)');