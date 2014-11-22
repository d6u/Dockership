var Docker = require('./docker-promisified');
var ssdConfig = require('./ssd-config');

module.exports = function () {
  return require('./get-keys')().spread(function (ca, cert, key) {

    var match = /^(\w+):\/\/([\w\.]+):(\d+)$/.exec(ssdConfig['connection']);

    if (!match) throw Error('ssd config does not have correct "connection" value');

    return new Docker({
      protocol: match[1],
      host: match[2],
      port: match[3],
      ca: ca,
      cert: cert,
      key: key
    });
  });
};
