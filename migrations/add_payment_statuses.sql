-- Add additional payment-related order statuses
INSERT INTO order_status (name, description)
VALUES 
  ('disputed', 'Payment is under dispute'),
  ('refund_pending', 'Refund has been initiated but not completed')
ON CONFLICT (name) DO NOTHING;