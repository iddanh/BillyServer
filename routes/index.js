'use strict';
var express = require('express');
var router = express.Router();

//GET Homepage
router.get('/', function (req, res, next) {
	res.send('Homepage');
});

module.exports = router;
