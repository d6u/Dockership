'use strict';

module.exports = function (string) {
  return string.replace(/([.*+?^${}()|\[\]\/\\])/g, '\\$1');
};
