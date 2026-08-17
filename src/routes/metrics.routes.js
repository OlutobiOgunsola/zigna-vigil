const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const requireToolAccess = require('../middleware/requireToolAccess.middleware');
const metricsController = require('../controllers/metrics');

router.use(auth);

router.get('/overview', requireToolAccess('vigil:metrics:overview'), metricsController.overview);
router.get('/questions', requireToolAccess('vigil:metrics:questions'), metricsController.questions);
router.get('/tools', requireToolAccess('vigil:metrics:tools'), metricsController.tools);
router.get('/tool-executions', requireToolAccess('vigil:metrics:tools'), metricsController.toolExecutions);
router.get('/providers', requireToolAccess('vigil:metrics:overview'), metricsController.providers);
router.get('/businesses', requireToolAccess('vigil:metrics:overview'), metricsController.businesses);
router.get('/users', requireToolAccess('vigil:metrics:overview'), metricsController.users);

module.exports = router;
