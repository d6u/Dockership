
// var getLogger = require('./lib/get-logger');
// var logStream = require('./lib/log-stream');
// var parseResponseStream = require('./lib/parse-response-stream');

// var logLocal  = getLogger('local');
// var logServer = getLogger('server');

module.exports = {
  status: require('./lib/status')
};

// require('./lib/get-docker')()
// .then(function (_docker) {
//   docker = _docker;
//   return docker.listImagesAsync();
// })
// .then(function (images) {
//   return fs.readFileAsync('../docker-nginx/meta.json')
//   .then(JSON.parse)
//   .then(function (meta) {
//     var repoName = 'baseimage-nginx';
//     var im = findImage(repoName, images);
//     if (im) {
//       var versions = im.RepoTags.map(function (tag) {
//         return tag.split(':')[1];
//       });
//       if (!versionsGt(meta[repoName].version, versions)) {
//         throw new Error('server has the same or greater version than local copies');
//       }
//     }
//     return meta;
//   });
// })
// .then(function (meta) {
//   fs.mkdir('./.tmp-ssd', function (err) {
//     if (err && err.code !== 'EEXIST') throw err;

//     makeTar('../docker-nginx', './.tmp-ssd/image-src.tar').then(function (tarPath) {
//       docker.buildImageAsync(
//         tarPath,
//         {
//           t: 'baseimage-nginx:' + meta['baseimage-nginx'].version,
//           nocache: true
//         }
//       )
//       .then(function (response) {
//         var transform = parseResponseStream();
//         var logger = logStream(logServer);
//         response.pipe(transform).pipe(logger);
//       });
//     });
//   });
// })
// .catch(function (err) {
//   logLocal(err);
// });

// function findImage(repoName, images) {
//   for (var i = 0; i < images.length; i++) {
//     for (var j = 0; j < images[i].RepoTags.length; j++) {
//       if (images[i].RepoTags[j].indexOf(repoName) > -1) {
//         return images[i];
//       }
//     }
//   }
// }

// function versionsGt(base, versions) {
//   for (var i = 0; i < versions.length; i++) {
//     if (semver.gt(base, versions[i])) {
//       return true;
//     }
//   }
//   return false;
// }
