CREATE TABLE IF NOT EXISTS shops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  unique_code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);