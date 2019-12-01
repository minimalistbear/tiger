const router = require('express').Router();

/** Defines the routes that shall be provided together with a versioning scheme */
router.use('/v1', require('./api/graph'));
router.use('/v1', require('./api/flows'));

module.exports = router;