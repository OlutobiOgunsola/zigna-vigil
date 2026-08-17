const { UnauthorizedError } = require('../errors');
const { jwt: jwtConfig } = require('../config/environment');

let verifyToken;
try {
  verifyToken = require('jsonwebtoken').verify;
} catch {
  verifyToken = (token) => {
    const jwt = require('jsonwebtoken');
    return jwt.verify(token, jwtConfig.secret);
  };
}

module.exports = async function authMiddleware(req, res, next) {
  try {
    // Dashboard: session-based
    if (req.session && req.session.userId) {
      req.userId = req.session.userId;
      req.isSuperAdmin = req.session.isSuperAdmin;
      return next();
    }

    // Mobile / API: JWT-based
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token, jwtConfig.secret);
      req.userId = decoded.userId;
      req.isSuperAdmin = decoded.isSuperAdmin;
      return next();
    }

    throw new UnauthorizedError('Not authenticated. Please log in.');
  } catch (error) {
    if (error instanceof UnauthorizedError) return next(error);
    error.code = 401;
    next(error);
  }
};
