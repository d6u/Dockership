var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');
var PropertyMissingError = require('../../lib/property-missing-error');

var rightConfig = require('../fixture/right-ssd-config.json');
var wrongConfig = require('../fixture/wrong-ssd-keys-config.json');

describe('Server', function () {
  var Server = proxyquire('../../index', {});

  describe('_getKeys', function () {
    beforeEach(function () {
      this.server = new Server('testing');
    });

    it('should throw PropertyMissingError if `ssd` is missing', function (done) {
      this.server._getKeys()
        .then(function () {
          done(new Error('did not throw error'));
        })
        .catch(PropertyMissingError, function (err) {
          expect(err.propertyName).eq('ssd');
          done();
        })
        .catch(done);
    });

    it('should throw AggregateError for all failed key config if wrong path to key', function (done) {
      this.server.ssd = wrongConfig;
      this.server._getKeys()
        .then(function () {
          done(new Error('did not throw error'));
        })
        .catch(Promise.AggregateError, function (errors) {
          expect(errors.length).eql(2);
          expect(errors[0].message).eql('cert config error: EISDIR, read');
          expect(errors[1].message).eql('key config error: EISDIR, read');
          done();
        })
        .catch(done);
    });

    it('should success - return a promise that resolve with keys', function (done) {
      this.server.ssd = rightConfig;
      this.server._getKeys()
        .then(function (keys) {
          expect(keys.ca.toString()).eql('ca\n');
          expect(keys.cert.toString()).eql('cert\n');
          expect(keys.key.toString()).eql('key\n');
          done();
        })
        .catch(done);
    });

  });
});
