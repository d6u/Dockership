module.exports = function () {
  return require('./get-docker')()
  .then(function (docker) {
    return docker.listContainersAsync();
  });
};
