'use strict';

var expect = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon = require('sinon');

var Promise = require('bluebird');

var rightConfig = require('../fixture/right-ssd-config.json');
var wrongConfig = require('../fixture/wrong-ssd-keys-config.json');

describe('getKeys', function () {

  it('should successfully return a promise and resolve with keys', function (done) {
    var getKeys = proxyquire('../../lib/get-docker/get-keys', {});

    getKeys(rightConfig)
      .then(function (keys) {
        expect(keys.ca.toString()).eql('ca\n');
        expect(keys.cert.toString()).eql('cert\n');
        expect(keys.key.toString()).eql('key\n');

        done();
      })
      .catch(done);
  });

  it('should throw AggregateError for all failed key config if wrong path to key', function (done) {
    var spy = sinon.spy();
    var getKeys = proxyquire('../../lib/get-docker/get-keys', {});

    getKeys(wrongConfig)
      .then(function () {
        done(new Error('should not execute'));
      })
      .catch(function (errors) {
        expect(errors).instanceof(Promise.AggregateError);
        expect(errors.length).eql(2);
        expect(errors[0].message).eql('cert config EISDIR, read');
        expect(errors[1].message).eql('key config EISDIR, read');
        done();
      })
      .catch(done);
  });
});
