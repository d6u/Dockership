var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var path = require('path');
var fs = require('fs');

describe('Server', function () {
  describe('_makeTar', function () {
    var Server, sandbox = sinon.sandbox.create();

    beforeEach(function () {
      Server = proxyquire('../../index', {});
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('should resolve with buffer of tar content', function (done) {
      Server.prototype._makeTar(path.resolve('examples')).then(function (buf) {
        fs.writeFile('.tmp/test.tar', buf, function (err) {
          done(err);
        });
      });
    });
  });
});
