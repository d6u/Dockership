'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

var Promise = require('bluebird');

var rightConfig = require('../fixture/right-ssd-config.json');
var wrongConfig = require('../fixture/wrong-ssd-keys-config.json');

describe('getKeys', function () {

  it('should successfully return a promise and resolve with keys', function (done) {
    var getKeys = proxyquire('../../lib/get-docker/get-keys', {
      '../get-config': function () {
        return Promise.resolve(rightConfig);
      }
    });

    getKeys()
      .then(function (keys) {
        expect(keys.ca.toString()).eql('ca\n');
        expect(keys.cert.toString()).eql('cert\n');
        expect(keys.key.toString()).eql('key\n');

        done();
      })
      .catch(done);
  });

  it('should return hash with undefined value if path to key was wrong', function (done) {
    var spy = sinon.spy();
    var getKeys = proxyquire('../../lib/get-docker/get-keys', {
      '../get-config': function () {
        return Promise.resolve(wrongConfig);
      }
    });

    getKeys()
      .then(function (keys) {
        expect(keys.ca.toString()).eql('ca\n');
        expect(keys.cert).undefined;
        expect(keys.key).undefined;

        done();
      })
      .catch(done);
  });
});
