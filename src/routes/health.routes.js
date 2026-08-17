const router = require('express').Router();
const { HealthController } = require('../controllers/health');

router.get('/', HealthController.check);

module.exports = router;
