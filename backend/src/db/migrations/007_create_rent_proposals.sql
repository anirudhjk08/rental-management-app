CREATE TABLE IF NOT EXISTS rent_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  relation_id UUID NOT NULL REFERENCES relations(id) ON DELETE CASCADE,
  proposed_by UUID NOT NULL REFERENCES users(id),
  old_rent DECIMAL(10, 2) NOT NULL,
  new_rent DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  effective_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);