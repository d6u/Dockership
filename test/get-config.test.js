var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');
var path    = require('path');

// var getConfig = require('../lib/get-config');

describe('getConfig', function () {

  it('should call getJson with correct path', function () {

    function getJson() {
      return Promise.resolve();
    }
    var spy = sinon.spy(getJson);
    var getConfig = proxyquire('../lib/get-config', {
      './get-json': spy
    });

    getConfig('meta');
    getConfig('ssd');

    expect(spy.args[0][0]).eql(path.resolve('source/meta.json'));
    expect(spy.args[1][0]).eql(path.resolve('stage/development/ssd.json'));
  });

  it('should reject with error if provide unrecognized config name', function (done) {
    function getJson() {
      return Promise.resolve();
    }
    var spy = sinon.spy(getJson);
    var getConfig = proxyquire('../lib/get-config', {
      './get-json': getJson
    });

    getConfig('xxx')
      .catch(function (err) {
        expect(err.message).eql('cannot recognize "xxx" as config in "undefined" stage');
        expect(spy.callCount).eql(0);
        done();
      })
      .catch(done);
  });
});
