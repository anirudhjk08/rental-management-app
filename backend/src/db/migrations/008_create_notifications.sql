CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('message', 'payment', 'rent_proposal', 'join_request')),
  is_read BOOLEAN DEFAULT FALSE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  rent_proposal_id UUID REFERENCES rent_proposals(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);