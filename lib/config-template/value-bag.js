'use strict';

function ValueBag(defs) {
  this.defs = {};
  for (var key in defs) {
    this.defs[key] = {
      name: key,
      generator: defs[key],
      existing: [],
      get: function () {
        var val = this.generator(this.existing);
        this.existing.push(val);
        return val;
      }
    }
  }
}

ValueBag.prototype.get = function (name) {
  if (name == null) {
    var obj = {};
    for (var key in this.defs) {
      obj[key] = this.defs[key].get();
    }
    return obj;
  } else {
    return this.defs[name].get();
  }
};

/**
 *
 * @param  {string|Object} name
 * @param  {any} value
 */
ValueBag.prototype.push = function (name, value) {
  if (typeof name === 'string') {
    this.defs[name].existing.push(value);
  } else {
    for (var key in name) {
      this.defs[key].existing.push(name[key]);
    }
  }
};

module.exports = ValueBag;
