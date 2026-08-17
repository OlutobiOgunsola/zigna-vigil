const conversationService = require('../../services/conversation.service');

module.exports = {
  async send(req, res, next) {
    try {
      const { message, business_name, user_fullname, user_email, session_id, history } = req.body;

      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.badRequest({ message: 'Message is required.' });
      }

      if (!business_name || typeof business_name !== 'string' || !business_name.trim()) {
        return res.badRequest({ message: 'business_name is required.' });
      }

      if (!user_fullname || typeof user_fullname !== 'string' || !user_fullname.trim()) {
        return res.badRequest({ message: 'user_fullname is required.' });
      }

      // Optional client-side history: [{ role: 'user'|'assistant', content: '...' }, ...]
      let clientHistory = [];
      if (Array.isArray(history)) {
        clientHistory = history
          .filter(
            (m) =>
              m &&
              (m.role === 'user' || m.role === 'assistant') &&
              typeof m.content === 'string' &&
              m.content.trim()
          )
          .map((m) => ({
            role: m.role,
            content: String(m.content).trim().slice(0, 4000),
          }))
          .slice(-24);
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
        clientHistory,
      });

      return res.ok({
        message: result.toolsUsed?.length ? 'Tools executed' : 'Response generated',
        data: {
          tool: result.toolsUsed?.[0] || null,
          tools_used: result.toolsUsed || [],
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
