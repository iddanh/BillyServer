'use strict';
var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var Q = require('q');
var _ = require('underscore');
var _s = require('underscore.string');

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

function dbQuery(query, values) {
	var deferred = Q.defer();
	dbPool.query(query, values, function (error, results, fields) {
		if (error) {
			deferred.reject(new Error(error));
		} else {
			deferred.resolve(results);
		}
	});
	return deferred.promise;
}

router.get('/', function (req, res) {
	res.send('API running!')
});

router.get('/checks', function (req, res) {
	var query = 'SELECT * FROM checks';
	var values = [];

	var where = req.query.where;
	var orderBy = req.query.orderby;
	var limit = req.query.limit;
	var badSyntax = false;

	//Add where clause to SQL query
	if(!_.isUndefined(where)){
		query += ' WHERE';
		var conditions = where.split(',');
		for (var i in conditions){
			var condition = conditions[i];
			var exp = new RegExp('[<>=]+');
			var parts = condition.split(exp);
			var oper = condition.match(exp);

			if(_s.isBlank(parts[0]) || _s.isBlank(parts[1]) || _.isNull(oper)){
				badSyntax = true;
				break;
			}

			query += ' ?? ' + oper + " ?";
			values.push(parts[0]);
			values.push(parts[1]);

			if (i < (conditions.length - 1)) {
				query += ' AND';
			}
		}
	}
	//Add order by clause to SQL query
	if (!_.isUndefined(orderBy)) {
		query += ' ORDER BY';
		var columns = orderBy.split(',');
		for (var i in columns) {
			var column = columns[i];

			query += ' ??';
			if (_s.startsWith(column, '-')) {
				column = _s.splice(column, 0, 1);
				query += ' DESC';
			}

			values.push(column);
			if (i < (columns.length - 1)) {
				query += ',';
			}
		}
	}
	//Add limit clause to SQL query
	if(!_.isUndefined(limit)){
		query += ' LIMIT ?';
		var nums = limit.split(',');
		for (var i in nums){
			nums[i] =  parseInt(nums[i]);

			if(_.isNaN(nums[i])){
				badSyntax = true;
				break;
			}
		}
		values.push(nums);
	}

	//console.log(req.query);

	console.log(query + " => " + values);

	if(badSyntax){
		return res.status(400).send("Bad query syntax");
	}

	dbQuery(query, values)
		.then(function (results) {
			res.json(results);
		})
		.fail(function (error) {
			console.log('Error GET checks: \n' + error);
			res.status(500).send(error.toString());
		});
});

router.post('/checks', function (req, res) {
	var b = req.body;
	var check = {
		owner_name: b.owner_name,
		amount: b.amount
	};

	dbQuery('INSERT INTO checks SET ?', check)
		.then(function (results) {
			res.json(results);
		})
		.fail(function (error) {
			console.log('Error POST check: \n' + error);
			res.status(500).send(error);
		});
});

router.get('/checks/:id', function (req, res) {
	dbQuery('SELECT * FROM checks WHERE id=?', req.params.id)
		.then(function (results) {
			res.json(results);
		})
		.fail(function (error) {
			console.log('Error GET check: \n' + error);
			res.status(500).send(error);
		});
});


module.exports = router;
