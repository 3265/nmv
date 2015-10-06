var fs = require('fs');
var path = require('path');
var _ = require('underscore');

function main(targetPath, callback) {
  if (_.isUndefined(callback)) callback = function() {};
  var isDir;
  var list = [];
  try {
    isDir = fs.lstatSync(targetPath).isDirectory();
  } catch (e) {
    throw new Error('file does not exsit');
  }
  if (!isDir) {
    list.push(targetPath);
    return callback(null, list);
  }

  fs.readdir(targetPath, function (err, files) {
    if (err) return callback(err);
    var remainingFiles = files.length;
    if (!remainingFiles) return callback(null, list);
    files.forEach(function (file) {
      fs.lstat(path.join(targetPath, file), function (err, stats) {
        if (err) return callback(err);
        file = path.join(targetPath, file);
        if (stats.isDirectory()) {
          if (file === '.git'|| file === 'node_modules') {
            remainingFiles--;
            if (!remainingFiles) callback(null, list);
            return;
          }
          files = main(file, function (err, res) {
            if (err) return callback(err);
            list = list.concat(res);
            remainingFiles--;
            if (!remainingFiles) callback(null, list);
          });
        } else {
          list.push(file);
          remainingFiles--;
          if (!remainingFiles) callback(null, list);
        }
      });
    });
  });
}

module.exports = main;
