import jwt from 'jsonwebtoken';

const protect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: 'Not authorized, token missing' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'empathwrite_ultra_secure_jwt_secret_token_2026');

    // Attach user information to request
    req.user = {
      id: decoded.userId
    };

    next();
  } catch (error) {
    console.error(`Auth Middleware Error: ${error.message}`);
    return res.status(401).json({ error: 'Not authorized, token invalid or expired' });
  }
};

export default protect;
