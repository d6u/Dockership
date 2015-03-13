var Dockership = require('../lib/index');
var Bluebird = require('bluebird');
var fs = Bluebird.promisifyAll(require('fs'));

Bluebird.join(
  fs.readFileAsync(process.env.DOCKER_CERT_PATH + '/ca.pem'),
  fs.readFileAsync(process.env.DOCKER_CERT_PATH + '/cert.pem'),
  fs.readFileAsync(process.env.DOCKER_CERT_PATH + '/key.pem'),
  function (ca, cert, key) {
    var match = process.env.DOCKER_HOST.match(/^tcp:\/\/(.+?):(\d+)$/);
    var ship = new Dockership({
      buildContext: 'examples/build-context',
      docker: {
        ca: ca,
        cert: cert,
        key: key,
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
        console.log('build', image);
      })
      .catch(function (err) {
        console.error(err);
        console.error(err.stack);
      });
  }
);
