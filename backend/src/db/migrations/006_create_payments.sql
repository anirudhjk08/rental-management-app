CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relation_id UUID NOT NULL REFERENCES relations(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  type VARCHAR(10) NOT NULL CHECK (type IN ('cash', 'online')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending_approval' CHECK (
    status IN ('pending_approval', 'confirmed', 'rejected', 'initiated', 'success', 'failed')
  ),
  initiated_by UUID REFERENCES users(id),
  confirmed_by UUID REFERENCES users(id),
  gateway_ref_id VARCHAR(255),
  note TEXT,
  payment_date TIMESTAMP DEFAULT NOW()
);