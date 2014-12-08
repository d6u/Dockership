var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

var Promise = require('bluebird');
var path    = require('path');

describe('getConfig', function () {

  it('should call getJson with correct path', function () {

    function getJson() {
      return Promise.resolve();
    }
    var spy = sinon.spy(getJson);
    var getConfig = proxyquire('../lib/get-config', {
      './get-json': spy
    });

    getConfig('meta', 'development');
    getConfig('ssd', 'development');
    getConfig('meta', 'production');
    getConfig('ssd', 'production');

    expect(spy.args[0][0]).eql(path.resolve('source/meta.json'));
    expect(spy.args[1][0]).eql(path.resolve('stage/development/ssd.json'));
    expect(spy.args[2][0]).eql(path.resolve('source/meta.json'));
    expect(spy.args[3][0]).eql(path.resolve('stage/production/ssd.json'));
  });

  it('should reject with error if provide unrecognized config name', function (done) {
    function getJson() {
      return Promise.resolve();
    }
    var spy = sinon.spy(getJson);
    var getConfig = proxyquire('../lib/get-config', {
      './get-json': getJson
    });

    getConfig('xxx', 'yyy')
      .catch(function (err) {
        expect(err.message).eql('cannot recognize "xxx" as config in "yyy" stage');
        expect(spy.callCount).eql(0);
        done();
      })
      .catch(done);
  });
});
