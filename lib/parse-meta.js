function escapeName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

module.exports = function (meta) {

  // make ports bings
  var portsBindings = {};
  var exposedPorts = {};
  meta['ports'].forEach(function (binding) {
    var ports = binding.split(':');
    portsBindings[ports[0] + '/tcp'] = [{'HostPort': ports[1]}];
    exposedPorts[ports[0] + '/tcp'] = {};
  });

  return {
    'name': escapeName( (new Date()).toJSON() ),
    'Image': meta['repo'] + ':' + meta['version'],
    'ExposedPorts': exposedPorts,
    'HostConfig': {
      'PortBindings': portsBindings
    }
  };
};
