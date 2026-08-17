const metricsService = require('../../services/metrics.service');

function parseDateRange(query) {
  const endDate = query.to || new Date().toISOString().slice(0, 10);
  const startDate = query.from || new Date(new Date(endDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { startDate, endDate };
}

module.exports = {
  async overview(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const data = await metricsService.getOverview({ productId: req.productId || null, startDate, endDate });
      return res.ok({ message: 'Overview fetched', data });
    } catch (error) {
      next(error);
    }
  },

  async questions(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const data = await metricsService.getQuestions({ productId: req.productId || null, startDate, endDate, limit, offset });
      return res.ok({ message: 'Questions fetched', data });
    } catch (error) {
      next(error);
    }
  },

  async tools(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const data = await metricsService.getTools({ productId: req.productId || null, startDate, endDate });
      return res.ok({ message: 'Tools fetched', data });
    } catch (error) {
      next(error);
    }
  },

  async toolExecutions(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const limit = parseInt(req.query.limit, 10) || 50;
      const offset = parseInt(req.query.offset, 10) || 0;
      const data = await metricsService.getToolExecutions({ productId: req.productId || null, startDate, endDate, toolName: req.query.tool_name, limit, offset });
      return res.ok({ message: 'Tool executions fetched', data });
    } catch (error) {
      next(error);
    }
  },

  async providers(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const data = await metricsService.getProviders({ productId: req.productId || null, startDate, endDate });
      return res.ok({ message: 'Providers fetched', data });
    } catch (error) {
      next(error);
    }
  },

  async businesses(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const data = await metricsService.getBusinesses({ productId: req.productId || null, startDate, endDate });
      return res.ok({ message: 'Businesses fetched', data });
    } catch (error) {
      next(error);
    }
  },

  async users(req, res, next) {
    try {
      const { startDate, endDate } = parseDateRange(req.query);
      const limit = parseInt(req.query.limit, 10) || 50;
      const data = await metricsService.getUsers({ productId: req.productId || null, startDate, endDate, limit });
      return res.ok({ message: 'Users fetched', data });
    } catch (error) {
      next(error);
    }
  },
};
