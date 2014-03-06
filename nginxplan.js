var Flightplan = require('flightplan'),
    path       = require('path'),
    util       = require('util'),
    fs         = require('fs');


function NginxPlan () {
  Flightplan.call(this);
  this.tmpDir = '/nginx-config-tmp';
  this.running = false;
}
util.inherits(NginxPlan, Flightplan);


/*
 * Get home dir of remote Nginx and set it as
 * prototype property
 */
NginxPlan.prototype._getRemoteHome = function () {
  this.remote(function (remote) {
    this.remoteHome = remote.exec('echo $HOME').stdout.trim();
  }.bind(this));
};


/*
 * Check if Nginx is running
 */
NginxPlan.prototype.isRunning = function () {
  this.remote(function (remote) {
    var output = remote.exec('ps ax | grep nginx', {silent: true}).stdout.trim();
    this.running = /nginx:\ master/.test(output);
    this.running ? remote.log('Nginx is running') : remote.log('Nginx is not running');
  }.bind(this));
};


/*
 * Find conf file in current directory
 *
 */
NginxPlan.prototype._findConfFile = function () {
  fs.readdirSync(process.cwd()).forEach(function (filename) {
    if (path.extname(filename) === '.conf') {
      this.confFile = String(filename);
    }
  }.bind(this));

  if (!this.confFile) {
    console.log('Error: There is no nginx conf file in this directory');
    process.exit(1);
  }
};

/*
 * Copy Nginx config files to  remote Nginx
 */
NginxPlan.prototype.copyConfig = function () {
  this._getRemoteHome();
  this.local(function (local) {
    local.log('Copying files to remote Nginx');
    var filesToCopy = fs.readdirSync(process.cwd());
    var homeDir = path.join(this.remoteHome, this.tmpDir);
    local.transfer(filesToCopy, homeDir);
  }.bind(this));
};


/*
 * Actions on remote Nginx
 */
NginxPlan.prototype.nginxAction = function (signal, customConfPath) {
  this.remote(function (remote) {
    if (!signal) remote.abort('missing Nginx action [start, stop, reload]');

    if (customConfPath) {
      var nginx = this._briefing.destinations.remote.remoteNginxPath;
      var cmd = util.format('sudo %s -c %s', nginx, customConfPath);
      if (signal !== 'start') {
        cmd = cmd + '-s ' + signal;
      }
    }
    else {
      var cmd = util.format('sudo service nginx %s', signal);
    }
    remote.log(signal + 'ing Nginx');
    remote.exec(cmd);
  }.bind(this));
};


/*
 * Copy config files and run Nginx using those
 */
NginxPlan.prototype.tryConfig = function () {
  var homeDir = '/home/' + this._briefing.destinations.remote.username;

  this._findConfFile();
  this.copyConfig();
  this.nginxAction('start', path.join(homeDir, this.tmpDir, this.confFile));
};


module.exports = NginxPlan;
