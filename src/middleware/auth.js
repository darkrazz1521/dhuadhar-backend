const jwt = require('jsonwebtoken');

/**
 * 🔐 Authentication middleware
 * - Verifies JWT
 * - Attaches decoded user to req.user
 */
exports.authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Authentication token missing',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid or expired token',
    });
  }
};

/**
 * 👑 Owner-only authorization middleware
 */
exports.ownerOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'owner') {
    return res.status(403).json({
      message: 'Owner access only',
    });
  }
  next();
};
