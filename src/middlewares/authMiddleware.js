const jwt = require('jsonwebtoken');
const { User } = require('../../models');

const authMiddleware = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);

    const user = await User.findByPk(decoded.id); 
    if (!user) {
      console.error('User not found in database');
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if the user is an admin based on role_id
const isAdmin = (req, res, next) => {
  // Check if the user's role_id is 1 (admin)
  if (req.user.role_id !== 1) {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

module.exports = { authMiddleware, isAdmin};
