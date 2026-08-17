const jwt = require('jsonwebtoken');
const config = require('../../config/environment');
const { UnauthorizedError } = require('../../errors');

module.exports = {
  async login(req, res, next) {
    try {
      const { secret } = req.body || {};

      if (!secret || secret !== config.dashboardSecret) {
        throw new UnauthorizedError('Invalid dashboard secret');
      }

      const token = jwt.sign(
        { userId: 1, isSuperAdmin: true },
        config.jwt.secret,
        { expiresIn: '7d', issuer: 'zigna-vigil' }
      );

      return res.ok({ message: 'Authenticated', data: { token } });
    } catch (error) {
      next(error);
    }
  },
};
