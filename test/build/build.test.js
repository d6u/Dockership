'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;
var sinon = require('sinon');

var Bluebird = require('bluebird');

var mockImages = require('../fixture/build.json');

describe('build()', function () {

  var buildFactory, _handleBuildResponseSpy, ship;

  beforeEach(function () {
    _handleBuildResponseSpy = sinon.spy();
    buildFactory = proxyquire('../lib/build/index.js', {
      './_make-tar': function () {},
      './_handle-build-response': _handleBuildResponseSpy
    });

    ship = {
      images: function () {
        return Bluebird.resolve(mockImages);
      },
      opts: {
        meta: {}
      }
    };
    buildFactory(ship);

    ship._buildImage = sinon.spy();
  })

  it('should call _buildImage if local is newer than remote', function (done) {
    ship.opts.meta = {version: '0.9.16'}; // Greater than 0.9.15 than mockImages
    ship
      .build()
      .then(function (image) {
        expect(_handleBuildResponseSpy.callCount).equal(1);
        expect(ship._buildImage.callCount).equal(1);
      })
      .then(done, done);
  });

  it('should throw image if remote has newest image', function (done) {
    ship.opts.meta = {version: '0.9.14'}; // Less than 0.9.15 than mockImages
    ship
      .build()
      .then(function () {
        done(new Error('should not execute.'));
      })
      .catch(function (image) {
        expect(_handleBuildResponseSpy.callCount).equal(0);
        expect(ship._buildImage.callCount).equal(0);
      })
      .then(done, done);
  });

});
