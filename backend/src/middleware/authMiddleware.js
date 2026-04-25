const jwt = require('jsonwebtoken');

// This middleware protects routes that require login
// It reads the JWT token from the request header and verifies it
// If valid, it attaches the userId to req.user so controllers can use it

const protect = (req, res, next) => {
  // Token comes in header as: "Bearer eyJhbGci..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: decoded.userId };
    next(); // move to the next middleware or controller
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized. Invalid token.' });
  }
};

module.exports = { protect };