'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;
var Bluebird = require('bluebird');

var mockContainers = require('./fixture/run/containers.json');

describe('run()', function () {

  it('should resolve', function (done) {
    var runFactory = proxyquire('../lib/run', {
      './util/parse-meta': function () {}
    });
    var containerArr = [mockContainers.slice(0, -1), mockContainers];

    var proto = {
      containers: function () {
        return Bluebird.resolve(containerArr.shift());
      },
      docker: {
        createContainerAsync: function () {
          return Bluebird.resolve({
            startAsync: function () {}
          });
        }
      },
      opts: {
        meta: {}
      }
    };

    runFactory(proto);

    proto
      .run()
      .then(function (container) {
        expect(container).eql(mockContainers.slice(-1)[0]);
      })
      .then(done, done);
  });

});

