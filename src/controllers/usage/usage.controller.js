const usageService = require('../../services/usage.service');

module.exports = {
  async getUsage(req, res, next) {
    try {
      const { month, user_id } = req.query;

      const result = await usageService.getUsage({
        activeBusinessId: req.activeBusinessId,
        activeBusinessType: req.activeBusinessType,
        month: month || null,
        userId: user_id || null,
      });

      return res.ok({
        message: 'Usage data fetched',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  },
};
