'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

describe('getKeys', function () {

  it('should successfully return a promise and resolve with keys', function (done) {
    var rightConfig = require('./fixture/right-ssd-config.json');
    var getKeys = proxyquire('../lib/get-keys', {'./ssd-config': rightConfig});

    getKeys().then(function (keys) {
      expect(keys.length).eql(3);

      // match the content of files
      expect(keys[0].toString()).eql('ca\n');
      expect(keys[1].toString()).eql('cert\n');
      expect(keys[2].toString()).eql('key\n');

      done();
    })
    .catch(done);
  });

  it('should fail to resolve with keys', function (done) {
    var wrongConfig = require('./fixture/wrong-ssd-keys-config.json');
    var spy = sinon.spy();
    var getKeys = proxyquire('../lib/get-keys', {
      './ssd-config': wrongConfig,
      './get-logger': function () {
        return spy;
      }
    });

    getKeys().catch(function (err) {
      expect(err.message).eql('Some key file cannot be located.');
      expect(spy.callCount).eql(2);
      done();
    })
    .catch(done);
  });
});
