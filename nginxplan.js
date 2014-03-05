var Flightplan = require('flightplan'),
    path       = require('path'),
    util       = require('util');


function NginxPlan () {
  Flightplan.call(this);
  this.tmpDir = 'nginx-config-' + (new Date()).getTime();
}
util.inherits(NginxPlan, Flightplan);


/*
 * Copy Nginx config files to  remote Nginx
 */
NginxPlan.prototype.copyConfig = function (local) {
  this.local(function (local) {
    local.transfer('test/testfile.txt', '/home/ubuntu/' + this.tmpDir);
  }.bind(this));
};

/*
 * Start remote Nginx
 */
NginxPlan.prototype.startNginx = function (command) {
  var cmd = command || 'sudo service nginx start';
  this.remote(function (remote) {
    remote.exec(cmd);
  });
};

/*
 * Stop remote Nginx
 */
NginxPlan.prototype.stopNginx = function (command) {
  var cmd = command || 'sudo service nginx stop';
  this.remote(function (remote) {
    remote.exec(cmd);
  });
};

/*
 * Restart remote Nginx
 */
NginxPlan.prototype.reloadNginx = function (command) {
  var cmd = command || 'sudo service nginx reload';
  this.remote(function (remote) {
    remote.exec(cmd);
  });
};

/*
 * Copy config files and run with Nginx using those
 */
NginxPlan.prototype.restartNginx = function (remote) {
  this.remote(function (remote) {
    this.copyConfig();
    this.start();
  }.bind(this));
};


module.exports = NginxPlan;
