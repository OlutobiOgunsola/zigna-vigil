const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const errorLogsController = require('../controllers/errorLogs');

router.use(auth);

router.get('/', errorLogsController.list);

module.exports = router;
