const router = require('express').Router();
const authMiddleware = require('../middleware/auth.middleware');
const businessEntityMiddleware = require('../middleware/businessEntity.middleware');
const requireToolAccess = require('../middleware/requireToolAccess.middleware');
const { PERMISSIONS } = require('../config/permissions');
const { UsageController } = require('../controllers/usage');

router.get(
  '/',
  authMiddleware,
  businessEntityMiddleware,
  requireToolAccess('vigil.usage.view'),
  UsageController.getUsage
);

module.exports = router;
