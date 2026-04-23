const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
// Must be called before anything else uses process.env
dotenv.config();

const app = express();

// Middleware
// express.json() lets Express read JSON request bodies
// cors() allows our Next.js frontend to call this backend
app.use(express.json());
app.use(cors());

// Health check route — always useful to verify server is running
app.get('/', (req, res) => {
  res.json({ message: 'Rental Management API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});