'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect     = require('chai').expect;
var sinon      = require('sinon');

var Bluebird = require('bluebird');

var mockContainers = require('./fixture/containers.json');

describe('containers()', function () {

  var Dockership, ship;

  it('should resolve with qualified containers', function (done) {
    Dockership = proxyquire('../lib/index', {
      './promisified/docker-promisified': function () {
        this.listContainersAsync = function () {
          return Bluebird.resolve(mockContainers);
        };
      }
    });

    ship = new Dockership({
      buildContext: '',
      docker: {},
      meta: {
        repo: 'someone/baseimage',
        version: '0.9.15'
      }
    });

    ship.containers().then(function (containers) {
      expect(containers.length).equal(6);
      containers.forEach(function (container) {
        expect(container.repo).equal('someone/baseimage');
      });
    })
    .then(done, done);
  });

});
