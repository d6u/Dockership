var expect     = require('chai').expect;
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var sinon      = require('sinon');

describe('up', function () {

  it('should emit info and end', function (done) {
    function noop() {};

    var up = proxyquire('../../lib/up', {
      '../get-config': noop,
      '../get-docker': noop,
      './get-image': noop,
      './get-container': function () {
        return function () {
          this.container = {Id: 'abc'};
        };
      },
      './cleanup-containers': noop,
      './start-container': noop
    });

    up().then(function (emitter) {
      var infoArr = ['container up and running', {Id: 'abc'}];
      emitter.on('info', function (info) {
        expect(info).eql(infoArr.shift());
      });
      emitter.on('end', function () {
        expect(infoArr.length).eql(0);
        done();
      });
    }).catch(done);
  });

  it('should emit error and end', function (done) {
    function noop() {};

    var e = new Error('123');

    var up = proxyquire('../../lib/up', {
      '../get-config': noop,
      '../get-docker': noop,
      './get-image': noop,
      './get-container': noop,
      './cleanup-containers': noop,
      './start-container': function () {
        return function () {
          throw e;
        };
      }
    });

    var i = 0;
    up().then(function (emitter) {
      emitter.on('error', function (err) {
        expect(err).eql(e);
        i += 1;
      });
      emitter.on('end', function () {
        expect(i).eql(1);
        done();
      });
    }).catch(done);
  });
});
