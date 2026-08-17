const errorLogsService = require('../../services/errorLogs.service');

function parseDateRange(query) {
  const endDate = query.to || new Date().toISOString().slice(0, 10);
  const startDate = query.from || new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { startDate, endDate };
}

module.exports = {
  async list(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const data = await errorLogsService.getErrorLogs({ productId: req.productId || null, startDate, endDate, limit, offset });
      return res.ok({ message: 'Error logs fetched', data });
    } catch (error) {
      next(error);
    }
  },
};
