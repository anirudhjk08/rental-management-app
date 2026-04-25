const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// Routes
const authRoutes = require('./routes/authRoutes');
const shopRoutes = require('./routes/shopRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Rental Management API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});