var express = require('express');
var debug = require('debug')('content');
var request = require('request');
var async = require('async');
var logger = require('morgan');
var fqnFinder = require('./fqnFinder');


var app = express();
app.use(logger('short'));
app.set('port', process.env.PORT || 4000);

function http() {
	var remoteHost = 'http://localhost:45737';
	var cache = {};
	function getPage(url, callback) {
		if (cache[url]) {
			return callback(null, cache[url]);
		}
		var requestOptions = {url: remoteHost + url, json:true};
		request.get(requestOptions, function (e, r, result) {
			cache[url] = result;
			return callback(e, result);
		});
	}

	return { getPage: getPage };
}

app.get('/api/fqn/:id/:fqn', function(req, res) {
	var fqns = req.params.fqn.split('|');
	var id = req.params.id;

	function callback(error, result) {
		console.log("Finished resolving: " + result.length)
		res.send(result);
	}

	var finder = fqnFinder(http());
	finder.locate(id, fqns, callback);
});

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
