#!/usr/bin/env node

var path = require('path');
var async = require('async');
var program = require('commander');
var pkg = require(path.join(__dirname, '..', 'package.json'));
var readfile = require(path.join(__dirname, '..', 'lib', 'file'));
var readAst = require(path.join(__dirname, '..', 'lib', 'read'));
var printResult = require(path.join(__dirname, '..', 'lib', 'print'));

program
  .version(pkg.version)
  .parse(process.argv);

var src = (program.args.length === 0) ? '.' : program.args[0];

async.waterfall([
  function(callback) {
    readfile(src, function(err, files) {
      if (err) callback(err);
      callback(null, files);
    });
  },
  function(files, callback) {
    readAst(files, function(err, requires) {
      if (err) callback(err);
      callback(null, requires);
    });
  }
],function(err, result) {
  if (err) throw new Error(err);
  printResult(result);
});

