var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

var PropertyMissingError = require('../../lib/property-missing-error');

describe('Server', function () {
  var Server = proxyquire('../../index', {});

  describe('constructor', function () {
    it('should yield no error', function () {
      var s = new Server('testing');
    });

    it('should yield PropertyMissingError if no stage assigned', function () {
      try {
        var s = new Server();
      } catch (e) {
        expect(e).instanceof(PropertyMissingError);
        expect(e.propertyName).eq('stage');
      }
    });
  });
});
