'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

var Promise = require('bluebird');

var rightConfig = require('./fixture/right-ssd-config.json');
var wrongConfig = require('./fixture/wrong-ssd-config.json')

var spy = sinon.spy();

var getKeysRight = proxyquire('../lib/get-keys', {'./get-config': rightConfig});
var getKeysWrong = proxyquire('../lib/get-keys', {
  './get-config': wrongConfig,
  './get-logger': function () {
    return spy;
  }
});

describe('getKeys', function () {

  it('should successfully return a promise and resolve with keys', function (done) {
    getKeysRight().then(function (keys) {
      expect(keys.length).eql(3);

      // match the content of files
      expect(keys[0].toString()).eql('ca\n');
      expect(keys[1].toString()).eql('cert\n');
      expect(keys[2].toString()).eql('key\n');
    })
    .finally(done);
  });

  it('should fail to resolve with keys', function (done) {
    getKeysWrong().catch(function (err) {
      expect(err.message).eql('Some key file cannot be located.');
      expect(spy.callCount).eql(2);
    })
    .finally(done);
  });
});
