const jwt = require('jsonwebtoken');
const { User } = require('../../models'); // Adjust to your User model path
const secretKey = process.env.JWT_SECRET; // Ensure you have a secret key in your .env

// Middleware to authenticate and set user info in req.user
const authUserMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
    
        // Log the incoming headers for debugging
        console.log("Incoming headers:", req.headers);
    
        // Check if the authorization header exists and starts with 'Bearer '
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          console.log("Authorization header missing or invalid format");
          return res.status(403).json({ error: 'No token provided' });
        }
    
        // Extract the token by removing 'Bearer ' prefix
        const token = authHeader.split(' ')[1];
    
        // Check if token was correctly extracted
        if (!token) {
          console.log("Token extraction failed");
          return res.status(403).json({ error: 'Token extraction failed' });
        }
    
        console.log("Extracted token:", token);
    
        // Verify the token
        const decoded = jwt.verify(token, secretKey);
    
        // Fetch user details from the database
        const user = await User.findByPk(decoded.id, {
          attributes: { exclude: ['password'] }
        });
    
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }
    
        // Set user info to the request object
        req.user = {
          id: user.id,
          role: user.role_name,
        };
    
        next(); // Proceed to the next middleware or route handler
      } catch (error) {
        console.error('Auth Middleware Error:', error.message);
        return res.status(401).json({ error: 'Unauthorized access' });
      }
    };
    

module.exports = {authUserMiddleware};
