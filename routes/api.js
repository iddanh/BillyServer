var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Q = require('q');

//DB connection
var dbPool = mysql.createPool({
	host: 'localhost',
	database: 'billy',
	user: 'admin',
	password: 'admin'
});

dbPool.on('connection', function (connection) {
	console.log('connected to db pool');
});

function dbQuery(query) {
	var deferred = Q.defer();
	dbPool.query(query, function (error, results, fields) {
		if (error) {
			deferred.reject(new Error(error));
		} else {
			deferred.resolve(results);
		}
	});
	return deferred.promise;
}

router.get('/', function (req, res, next) {
	//dbPool.query('SELECT * FROM billy.check', function (error, results, fields) {
	//	if(error){
	//		return console.log(error);
	//	}
	//	res.json(results);
	//});

	//Q.ninvoke(dbPool, 'query', 'SELECT * FROM billy.check')
	//	.then(function (results) {
	//		console.log(results[1]);
	//		res.json(results[0]);
	//	}, function (error) {
	//		console.log('error' + error);
	//	});

	dbQuery('SELECT * FROM billy.check')
		.then(function (results) {
			res.json(results);
		})
		.fail(function (error) {
			console.log('error' + error);
		});
});

module.exports = router;
