'use strict';

var _check = require('./util/_check');

module.exports = function (proto) {

  proto.start = function (id) {
    _check(id, 'id');
    return this.docker.getContainer(id).startAsync();
  };

};
