var Dockership = require('../lib/index');

var match = process.env.DOCKER_HOST.match(/^tcp:\/\/(.+?):(\d+)$/);
var ship = new Dockership({
  buildContext: 'examples/build-context',
  docker: {
    ca:   process.env.DOCKER_CERT_PATH + '/ca.pem',
    cert: process.env.DOCKER_CERT_PATH + '/cert.pem',
    key:  process.env.DOCKER_CERT_PATH + '/key.pem',
    host: match[1],
    port: match[2]
  },
  meta: {
    repo: 'dockership/boot2docker-example',
    version: '0.0.1'
  }
})

// A loger helper come with Dockership to log buildMessage to stdout
var logger = Dockership.makeLogger();

ship.on('buildMessage', logger); // Attach logger to buildMessage

ship
  .build()
  .then(function (image) {
    return this.start();
  })
  .then(function (container) {
    console.log('container', container);
  }, function (err) {
    console.error('err', err.stack);
  })
  .then(function () {
    return this.stop();
  })
  .then(function () {
    console.log('stopped');
  });
