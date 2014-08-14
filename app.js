var express = require('express');
var debug = require('debug')('content');
var request = require('request');
var async = require('async');
var logger = require('morgan');

var app = express();
app.use(logger('short'));
app.set('port', process.env.PORT || 4000);

app.get('/api/entities', function(req, res) {
	res.send( {
		matter: '/api/matter'
	});
})

app.get('/api/matter/:id', function(req, res) {
	res.send( {
		id: req.params.id,
		description: "description",
		solicitors: ['/api/contact/1', 'api/contact/2'],
		clients: ['/api/contact/1', 'api/contact/2']
		});
})

app.get('/api/contact/:id', function(req, res) {
	res.send( {
		id: req.params.id,
		firstname: "andrew",
		surname: 'smith'
		});
})

app.get('/api/fqn/:id/:fqn', function(req, res) {
	var fqns = req.params.fqn.split('|');

	function lookUpFqn(fqn, callback) {
		function traceFqn(index, fqnParts, url, callback) {
			if (index === 1) {
				url = url + '/'+ req.params.id
			}
			var requestOptions = {url: 'http://localhost:45737' + url, json:true};
			console.log("Loading: " + url);
			request.get(requestOptions, function (e, r, result) {
				var urlToFetch = fqnParts[index];
				var value;
				if (urlToFetch.indexOf('(') !== -1) {
					var propertySections = urlToFetch.replace(')', '').split('(');
					var array = result[propertySections[0]];
					value = array[propertySections[1]];
				} else {
					value = result[urlToFetch];
				}

				if (value[0] === '/') {
					return traceFqn(index + 1, fqnParts, value, callback);
				}

				return callback(e, {fqn: fqn, value: result[urlToFetch]});
		    });
		}
		var fqnParts = fqn.split('.');
		traceFqn(0, fqnParts, '/api/entities/', callback);
	}

	async.map(fqns, lookUpFqn, callback);

	function callback(error, result) {
		res.send(result);
	}
})

var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
