'use strict';

var proxyquire = require('proxyquire').noPreserveCache().noCallThru();
var expect = require('chai').expect;

describe('ValueBag', function () {

  var ValueBag, portFunction, valueBag;

  beforeEach(function () {
    ValueBag = proxyquire('../../lib/config-template/value-bag', {});

    portFunction = function (existing) {
      if (existing.length) {
        return existing[existing.length - 1] + 1;
      } else {
        return 9000;
      }
    };

    valueBag = new ValueBag({
      port: portFunction
    });
  });

  it('should create defs property', function () {
    expect(valueBag.defs.port.name).equal('port');
    expect(valueBag.defs.port.generator).equal(portFunction);
    expect(valueBag.defs.port.existing).eql([]);
    expect(valueBag.defs.port.get()).equal(9000);
    expect(valueBag.defs.port.existing).eql([9000]);
    expect(valueBag.defs.port.get()).equal(9001);
    expect(valueBag.defs.port.existing).eql([9000, 9001]);
  });

  describe('get()', function () {
    it('should return object with all values', function () {
      expect(valueBag.get()).eql({port: 9000});
      expect(valueBag.get()).eql({port: 9001});
    });

    it('should return value for name', function () {
      expect(valueBag.get('port')).eql(9000);
      expect(valueBag.get('port')).eql(9001);
    });
  });

  describe('push()', function () {
    it('should push existing value to named def', function () {
      valueBag.push('port', 9000);
      expect(valueBag.get()).eql({port: 9001});
    });

    it('should return value for name', function () {
      valueBag.push({port: 9000});
      expect(valueBag.get()).eql({port: 9001});
    });
  });

});
