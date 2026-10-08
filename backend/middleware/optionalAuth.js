import jwt from 'jsonwebtoken';

const optionalProtect = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'empathwrite_ultra_secure_jwt_secret_token_2026');
      req.user = {
        id: decoded.userId
      };
    }
  } catch (error) {
    // Ignore invalid tokens and proceed as guest/anonymous
  }
  next();
};

export default optionalProtect;
