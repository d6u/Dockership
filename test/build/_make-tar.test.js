'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;

var EventEmitter = require('events').EventEmitter;

describe('_makeTar()', function () {

  var _makeTar;

  it('should resolve with a buffer of all tar content', function (done) {
    _makeTar = proxyquire('../../lib/build/_make-tar', {
      'archiver': function () {
        var ee = new EventEmitter();
        ee.bulk = function () {};
        ee.finalize = function () {
          this.emit('data', new Buffer('part1'));
          this.emit('data', new Buffer('part2'));
          this.emit('data', new Buffer('part3'));
          this.emit('end');
        };
        return ee;
      }
    });

    _makeTar.bind({opts: {}})().then(function (tarContent) {
      expect(tarContent.toString()).equal('part1part2part3');
    }).then(done, done);
  });

});
