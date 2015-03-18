var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var Bluebird = require('bluebird');
var fs = require('../lib/promisified/fs-promisified.js');

describe('constructor', function () {
  var Dockership, sandbox = sinon.sandbox.create(), makeDocker;

  beforeEach(function () {
    makeDocker = sandbox.spy();
    Dockership = proxyquire('../lib/index', {'./util/make-docker': makeDocker});
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('should throw error if options are complete', function () {
    var error;
    try {
      new Dockership({
        // buildContext: '',
        docker: {},
        meta: {}
      });
    } catch (err) {
      error = err;
    }
    expect(error).not.undefined;
    expect(error.message).equal('"opts.buildContext" is required but not defined');
    expect(makeDocker.callCount).equal(0);
  });
});
