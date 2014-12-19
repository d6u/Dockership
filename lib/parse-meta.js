var PropertyMissingError = require('./property-missing-error');
var FieldNotValidError   = require('./field-not-valid-error');

function escapeName(name) {
  return name.replace(/[^a-zA-Z0-9_.-]/g, '_');
}

module.exports = function (meta) {
  var params = {};

  if (!meta['repo']   ) throw new PropertyMissingError('repo');
  if (!meta['version']) throw new PropertyMissingError('version');
  params['Image'] = meta['repo'] + ':' + meta['version'];

  if (meta['hostname']    ) params['Hostname']     = meta['hostname'];
  if (meta['user']        ) params['User']         = meta['user'];
  if (meta['memory']      ) params['Memory']       = meta['memory'];
  if (meta['cpu-share']   ) params['CpuShares']    = meta['cpu-share'];
  if (meta['cpuset']      ) params['Cpuset']       = meta['cpuset'];
  if (meta['env']         ) params['Env']          = meta['env'];
  if (meta['cmd']         ) params['Cmd']          = meta['cmd'].split(' ');
  if (meta['entrypoint']  ) params['Entrypoint']   = meta['entrypoint'];
  if (meta['WorkingDir']  ) params['WorkingDir']   = meta['workdir'];
  if (meta['SecurityOpts']) params['SecurityOpts'] = meta['security-opt'];
  // params['MemorySwap']
  // params['NetworkDisabled']
  // params['MacAddress']
  // params['Domainname']

  // Host Config
  //
  var hostConfig = {};

  if (meta['link']        ) hostConfig['Links']           = meta['link'];
  if (meta['publish-all'] ) hostConfig['PublishAllPorts'] = meta['publish-all'];
  if (meta['privileged']  ) hostConfig['Privileged']      = meta['privileged'];
  if (meta['dns']         ) hostConfig['Dns']             = meta['dns'];
  if (meta['dns-search']  ) hostConfig['DnsSearch']       = meta['dns-search'];
  if (meta['volumes-from']) hostConfig['VolumesFrom']     = meta['volumes-from'];
  if (meta['cap-add']     ) hostConfig['CapAdd']          = meta['cap-add'];
  if (meta['cap-drop']    ) hostConfig['CapDrop']         = meta['cap-drop'];
  if (meta['net']         ) hostConfig['NetworkMode']     = meta['net'];
  if (meta['devices']     ) hostConfig['Devices']         = meta['devices'];
  // hostConfig['LxcConf']
  // hostConfig['RestartPolicy']

  // Volumes
  //
  if (meta['volume'] && meta['volume'].length) {
    var volumeRegex = /^(?:([\w\/]+):)?([\w\/]+)(?::(ro|rw))?$/;
    params['Volumes'] = {};
    meta['volume'].forEach(function (v) {
      var m = volumeRegex.exec(v);
      if (!m) throw new FieldNotValidError('volume', v, '/^(<host_path>:)?<container_path>(:ro|rw)?$/');
      params['Volumes'][m[2]] = {};

      if (m[1]) {
        if (!hostConfig['Binds']) hostConfig['Binds'] = [];
        hostConfig['Binds'].push(v);
      }
    });
  }

  // Port Bindings
  //
  if (meta['publish'] && meta['publish'].length) {
    var publishRegex = /^(?!:)(?:(?:((?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)):)?(\d+)?:)?(\d+)$/;

    params['ExposedPorts'] = {};

    meta['publish'].forEach(function (p) {
      var m = publishRegex.exec(p);
      if (!m) throw new FieldNotValidError('publish', p, '/^(?!:)((<ip>:)?(<hostPort>)?:)?<containerPort>$/');
      params['ExposedPorts'][m[3]+'/tcp'] = {};

      if (m[2]) {
        if (!hostConfig['PortBindings']) hostConfig['PortBindings'] = {};
        hostConfig['PortBindings'][m[3]+'/tcp'] = [{ 'HostPort': m[2] }];
      }
    });
  }

  if (Object.keys(hostConfig).length) params['HostConfig'] = hostConfig;
  params['name'] = meta['name'] || escapeName( (new Date()).toJSON() );

  // TODO: parse meta['expose']

  return params;
};
