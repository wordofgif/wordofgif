var when = require('when');
var sh = require('shelljs');
var child_process = require('child_process');

function run(executable, args) {
  var binPath = sh.pwd() + '/vendor/bin/osx/';
  var deferred = when.defer();
  // hack: files are bundled with 444
  sh.chmod(755, binPath + executable);
  console.log("invoking", binPath, executable, "with:", args.join(" "));

  var process = child_process.execFile(executable, args, {
    env: {
      DYLD_LIBRARY_PATH: binPath,
      PATH: binPath
    }
  });

  // call callback, when done
  process.on('close', function(code) {
    console.log('child process exited with code ' + code);
    if (code === 0) {
      deferred.resolve();
    } else {
      deferred.reject();
    }
  });

  process.stdout.on('data', function(data) {
    console.log('stdout: ' + data);
  });

  process.stderr.on('data', function(data) {
    console.log('stderr: ' + data);
  });
  return deferred.promise;
}

module.exports = {"run": run};
