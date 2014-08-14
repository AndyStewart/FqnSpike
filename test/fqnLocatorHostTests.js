var should = require('should');
var async = require('async');

function createResult(searchForFqn, result) {
	var parts = searchForFqn.split('.');
	var value = result[parts[1]];
	var isCount = parts[parts.length -1] === 'Count';
	if (isCount && value) {
		value = value.length;
	}

	return {
		root: parts[0],
		fqnParts: parts,
		results: result,
		isCount: isCount,
		isLink: value && value[0] === '/',
		value: value
	}
}

function fqnFinder(http) {
	var entityUrl = '/api/entities';
	function locateFqn(id, fqn, callback) {

		function loadPage(url, callback) {
			http.getPage(entityUrl, function(err, result) {
				var resultPage = createResult(fqn, result);
				if (resultPage.isLink) {
					return loadPage(resultPage.value, callback);
				}

				return callback(err, resultPage.value);
			});
		}

		loadPage(entityUrl, callback);
	}

	var locate = function(id, fqns, callback) {
		function findFqn(fqn, callback) {
			locateFqn(id, fqn, callback);
		}
		async.map(fqns, findFqn, callback);
	}

	return { locate: locate };
}

describe("When retrieving basic matter content", function() {
	var testResult;

	var entityResult = {
		Matter: '/api/matter'
	};
	var matterResult = {
		Id: 1,
		Description: 'My Matter Description',
		Solicitors: [ '/api/contact/1', '/api/contact/2']
	};

	function getPage(url, callback) {
		if (url === '/api/entities') {
			process.nextTick(function() { 
				return callback(null, entityResult);
			});
		}

		if (url === '/api/matter/1') {
			process.nextTick(function() { 
				return callback(null, matterResult)
			});
		}
	}

	beforeEach(function(done) {
		var locator = fqnFinder({getPage: getPage});
		locator.locate(1, ['Matter.Description', 'Matter.Id', 'Matter.Solicitors.Count'], function(err, result) {
			testResult = result;
			done();
		})
	});

	it("Should load matter and retrieve basic fields", function() {
		testResult[0].should.equal('My Matter Description');
		testResult[1].should.equal(1);
	});

	it("Should load count for arrays", function() {
		testResult[2].should.equal(2);
	});
});

describe("When retrieving related matter content", function() {
	var testResult;

	var entityResult = {
		Matter: '/api/matter'
	};
	var matterResult = {
		Id: 1,
		Description: 'My Matter Description',
		Solicitors: [ '/api/contact/1', '/api/contact/2']
	};

	var contactResult = {
		Id: 2,
		Firstname: 'Bob',
		Surname: 'Smith'
	};

	function getPage(url, callback) {
		if (url === '/api/entities') {
			process.nextTick(function() { 
				return callback(null, entityResult);
			});
		}

		if (url === '/api/matter/1') {
			process.nextTick(function() { 
				return callback(null, matterResult)
			});
		}
		if (url === '/api/contact/1' || url === '/api/contact/2') {
			process.nextTick(function() { 
				return callback(null, contactResult)
			});
		}
	}

	beforeEach(function(done) {
		var locator = fqnFinder({getPage: getPage});
		locator.locate(1, ['Matter.Solicitors[1].Firstname', 'Matter.Solicitors[1].Surname'], function(err, result) {
			testResult = result;
			done();
		});
	});

	it("Should load matter and retrieve basic fields", function() {
		testResult[0].should.equal('Bob');
		testResult[1].should.equal('Smith');
	});
});