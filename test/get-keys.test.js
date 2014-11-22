'use strict';

var expect = require('chai').expect;
var proxyquire =  require('proxyquire').noPreserveCache().noCallThru();
var Promise = require('bluebird');

var rightConfig = {
  'ca': './test/fixture/keys-docker/ca.txt',
  'cert': './test/fixture/keys-docker/cert.txt',
  'key': './test/fixture/keys-docker/key.txt'
};

var wrongConfig = {
  'ca': './test/fixture/keys-docker/ca.txt',
  'cert': '',
  'key': ''
};

var getKeysRight = proxyquire('../lib/get-keys', {
  './get-config': rightConfig
});

var getKeysWrong = proxyquire('../lib/get-keys', {
  './get-config': wrongConfig
});

describe('getKeys', function () {

  it('should successfully return a promise and resolve with keys', function (done) {
    getKeysRight().then(function (keys) {
      expect(keys.length).eql(3);
      expect(keys[0].toString()).eql('ca\n');
      expect(keys[1].toString()).eql('cert\n');
      expect(keys[2].toString()).eql('key\n');
      done();
    });
  });

  it('should fail to resolve with keys', function (done) {
    getKeysWrong().catch(function (err) {
      expect(err.message).eql('Some key file cannot be located.');
      done();
    });
  });
});
