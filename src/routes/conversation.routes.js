const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const businessEntityMiddleware = require('../middleware/businessEntity.middleware');
const rateLimiter = require('../middleware/rateLimiter.middleware');
const { ConversationController } = require('../controllers/conversation');

router.post(
  '/',
  authMiddleware,
  businessEntityMiddleware,
  rateLimiter,
  ConversationController.send
);

module.exports = router;
