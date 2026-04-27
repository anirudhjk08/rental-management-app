CREATE TABLE IF NOT EXISTS relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shop_id UUID NOT NULL REFERENCES shops(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'ended')),
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE UNIQUE INDEX one_active_tenant_per_shop
ON relations (shop_id)
WHERE status = 'active';