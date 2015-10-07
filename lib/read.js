var esprima = require('esprima');
var estraverse = require('estraverse');
var fs = require('fs');
var _ = require('underscore');
var async = require('async');

var main = function(files, callback) {
  if (!_.isArray(files)) throw new TypeError('files type invelid');
  if (_.isUndefined(callback)) callback = function() {};
  var list = [];
  async.each(files, function(file, next) {
    if (!file.match(/\.js$/i)) return next(null);
    fs.readFile(file, 'utf8', function(error, data) {
      if (error) next(error);
      estraverse.traverse(esprima.parse(data), {
        enter: function (node, parent) {
          getModules(node, parent);
          getMethods(node);
        }
      });
      list = initScope(list);
      next(null);
    });
  }, function(error) {
    list = _.reject(list, function (moduleObj) {
      return _.isUndefined(moduleObj.name);
    });
    callback(error, list);
  });

  var getModules = function(node, parent) {
    if (node.type !== 'CallExpression') return;
    if (!node.callee) return;
    if (node.callee.name !== 'require') return;
    if (!node.arguments[0]) return;
    if (/^[-a-zA-Z0-9]+$/.test(node.arguments[0].value) === false) return;
    var isModuleExist = _.some(list, function (moduleObj, moduleIndex) {
      if (moduleObj.name !== node.arguments[0].value) return;
      if (parent.id && parent.id.name) list[moduleIndex].params.push(parent.id.name);
      list[moduleIndex].count++;
      return true;
    });
    var params = parent.id && parent.id.name ? [ parent.id.name ] : [];
    var newModuleObj = {
      name: node.arguments[0].value,
      count: 1,
      params: params,
      method: []
    };
    if (!isModuleExist) list.push(newModuleObj);
  };

  var getMethods = function(node) {
    if (node.type !== 'MemberExpression') return;
    if (!node.object) return;
    if (!node.object.name) return;
    if (!node.property) return;
    if (!node.property.name) return;
    _.some(list, function (moduleObj, moduleIndex) {
      return _.some(moduleObj.params, function (param) {
        if (param !== node.object.name) return;
        var isMethodExist = _.some(moduleObj.method, function (methodObj, methodIndex) {
          if (methodObj.name !== node.property.name) return;
          list[moduleIndex].method[methodIndex].count++;
          return true;
        });
        var newMethodObj = {
          name: node.property.name,
          count: 1,
        };
        if (!isMethodExist) moduleObj.method.push(newMethodObj);
        return true;
      });
    });
  };

  var initScope = function (list) {
    _.each(list, function (moduleObj, moduleIndex) {
      list[moduleIndex].params = [];
    });
    return list;
  };
};

module.exports = main;
