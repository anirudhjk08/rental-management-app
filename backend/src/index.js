const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const pool = require('./db/index');

dotenv.config();

const app = express();

// We need to create an HTTP server manually now
// because Socket.io needs to attach to the same server as Express
const server = http.createServer(app);

// Attach Socket.io to the HTTP server
const io = new Server(server, {
  cors: {
    origin: '*', // allow all origins for now
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');
const chatRoutes = require('./routes/chatRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const rentRoutes = require('./routes/rentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/rent', rentRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Rental Management API is running' });
});

// ─────────────────────────────────────────
// SOCKET.IO — Real-time Chat Logic
// ─────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Client joins a chat room for a specific relation
  socket.on('join_room', (relationId) => {
    socket.join(relationId);
    console.log(`Socket ${socket.id} joined room: ${relationId}`);
  });

  // Client sends a message
  socket.on('send_message', async (data) => {
    const { relationId, senderId, content } = data;

    if (!relationId || !senderId || !content) {
      socket.emit('error', { message: 'relationId, senderId and content are required' });
      return;
    }

    try {
      // Verify the relation exists and is active
      const relationResult = await pool.query(
        `SELECT r.*, s.owner_id 
         FROM relations r
         JOIN shops s ON s.id = r.shop_id
         WHERE r.id = $1 AND r.status = 'active'`,
        [relationId]
      );

      if (relationResult.rows.length === 0) {
        socket.emit('error', { message: 'Active relation not found' });
        return;
      }

      const relation = relationResult.rows[0];

      // Only owner or tenant can send messages in this relation
      const isParticipant =
        relation.owner_id === senderId ||
        relation.tenant_id === senderId;

      if (!isParticipant) {
        socket.emit('error', { message: 'Not authorized to send messages in this relation' });
        return;
      }

      // Save message to DB
      const messageResult = await pool.query(
        `INSERT INTO messages (relation_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [relationId, senderId, content]
      );

      const message = messageResult.rows[0];

      // Get sender name for the response
      const senderResult = await pool.query(
        'SELECT name FROM users WHERE id = $1',
        [senderId]
      );

      const fullMessage = {
        ...message,
        sender_name: senderResult.rows[0]?.name,
      };

      // Broadcast message to everyone in the room (including sender)
      io.to(relationId).emit('new_message', fullMessage);

    } catch (err) {
      console.error('Socket send_message error:', err.message);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  // Load previous messages when user opens chat
  socket.on('get_messages', async (data) => {
    const { relationId } = data;

    try {
      const result = await pool.query(
        `SELECT m.*, u.name as sender_name
         FROM messages m
         JOIN users u ON u.id = m.sender_id
         WHERE m.relation_id = $1
         ORDER BY m.created_at ASC`,
        [relationId]
      );

      // Send message history only to the requesting socket
      socket.emit('message_history', result.rows);

    } catch (err) {
      console.error('Get messages error:', err.message);
      socket.emit('error', { message: 'Failed to load messages' });
    }
  });

  // Mark messages as read
  socket.on('mark_read', async (data) => {
    const { relationId, userId } = data;

    try {
      await pool.query(
        `UPDATE messages 
         SET is_read = TRUE 
         WHERE relation_id = $1 AND sender_id != $2 AND is_read = FALSE`,
        [relationId, userId]
      );

      socket.emit('messages_marked_read', { relationId });

    } catch (err) {
      console.error('Mark read error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// Use server.listen instead of app.listen
// This is because Socket.io is attached to server, not app
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});