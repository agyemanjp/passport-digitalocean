/* global describe, it, expect */
var expect = require('expect.js');
var strategy = require('../dist');

describe('passport-digitalocean', function () {

	//   it('should export Strategy constructor directly from package', function() {
	//     expect(strategy).to.be.a('function');
	//     expect(strategy).to.equal(strategy.Strategy);
	//   });

	it('should export Strategy constructor', function () {
		expect(strategy.Strategy).to.be.a('function');
	});

});
