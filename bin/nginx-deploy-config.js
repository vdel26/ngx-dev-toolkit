#!/usr/bin/env node

var NginxPlan = require('../nginxplan.js'),
    program   = require('commander'),
    path      = require('path');

program
  .version(require('../package.json').version)
  .usage('<action> [options]')
  .option('-f, --file [file-path]', 'Path to the configuration file (JSON format)', 'nofile')
  .parse(process.argv);


if (program.file === 'nofile') {
  console.log('Error: A configuration file is required');
  program.help();
  process.exit(1);
}


try {
  var config = require(path.join(process.cwd(), program.file));
}
catch (e) {
  console.log('Error: Invalid config format');
  program.help();
  process.exit(1);
}

var plan = new NginxPlan();

plan.briefing({
  debug: true,
  destinations: {
    'remote': {
      host: config.host,
      username: config.username,
      port: config.port || 22,
      privateKey: config.privateKey
    }
  }
});

switch (process.argv[2]) {
  case 'start':
    plan.startNginx();
    break;
  case 'stop':
    plan.stopNginx();
    break;
  case 'copy':
    plan.copyConfig();
    break;
  case 'reload':
    plan.reloadNginx();
    break;
  default:
    console.log('Error: Invalid action');
    program.help();
    process.exit(1);
}

plan.start('remote', {});
