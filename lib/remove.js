'use strict';


module.exports = function (proto) {

  proto.remove = function (id) {
    var container = this.docker.getContainer(id);

    return container
      .stopAsync()
      .then(function () {
        return container.removeAsync();
      });
  };

};
