const conversationService = require('../../services/conversation.service');

module.exports = {
  async send(req, res, next) {
    try {
      const { message, business_name, user_fullname, user_email, session_id } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.badRequest({ message: 'Message is required.' });
      }

      if (!business_name || typeof business_name !== 'string' || !business_name.trim()) {
        return res.badRequest({ message: 'business_name is required.' });
      }

      if (!user_fullname || typeof user_fullname !== 'string' || !user_fullname.trim()) {
        return res.badRequest({ message: 'user_fullname is required.' });
      }

      const result = await conversationService.processMessage({
        message: message.trim(),
        userId: req.userId,
        activeBusinessId: req.activeBusinessId,
        productId: req.productId,
        productSlug: req.productSlug,
        activeBusinessType: req.activeBusinessType,
        activeRole: req.activeRole,
        isSuperAdmin: req.isSuperAdmin,
        businessName: business_name.trim(),
        userFullname: user_fullname.trim(),
        userEmail: user_email || null,
        sessionId: session_id || null,
      });

      if (result.tool) {
        return res.ok({
          message: 'Tool executed',
          data: {
            tool: result.tool,
            result: result.toolResult,
            response: null,
            session_id: result.sessionId,
          },
        });
      }

      return res.ok({
        message: 'Response generated',
        data: {
          tool: null,
          result: null,
          response: result.response,
          session_id: result.sessionId,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};
