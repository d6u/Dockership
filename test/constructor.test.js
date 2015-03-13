var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var Bluebird = require('bluebird');
var fs = require('../lib/promisified/fs-promisified.js');

describe('constructor', function () {
  var Server, sandbox = sinon.sandbox.create(), dockerSpy;

  beforeEach(function () {
    dockerSpy = sandbox.spy();
    Server = proxyquire('../lib/index', {'./lib/docker-promisified': dockerSpy});
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should throw error if options are complete', function () {
    var error;
    try {
      new Server({
        // buildContext: '',
        docker: {},
        meta: {}
      });
    } catch (err) {
      error = err;
    }
    expect(error).not.undefined;
    expect(error.message).equal('"opts.buildContext" is required but not defined');
    expect(dockerSpy.callCount).equal(0);
  });
});
