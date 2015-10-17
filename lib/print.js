var _ = require('underscore');
var blessed = require('blessed');
var contrib = require('blessed-contrib');
var terminal = blessed.screen();
var grid = new contrib.grid({rows: 12, cols: 12, screen: terminal});
var theme = ['green','cyan','red','yellow','blue'];

var tree = grid.set(0, 0, 10, 2, contrib.tree, {
  label: 'Module Tree',
  fg: 'green'
});
var moduleTable = grid.set(2, 2, 10, 5, contrib.table,{
  keys: true,
  fg: 'white',
  selectedfg: 'white',
  selectedbg: 'blue',
  interactive: true,
  label: 'Module Table',
  width: '33%',
  height: '30%',
  border: {type: "line", fg: "cyan"},
  columnspacing: 10,
  columnWidth: [25, 20, 25]
});
var methodTable = grid.set(2, 7, 10, 5, contrib.table,{
  keys: true,
  fg: 'white',
  selectedfg: 'white',
  selectedbg: 'blue',
  interactive: true,
  label: 'Method Table',
  width: '30%',
  height: '30%',
  border: {type: "line", fg: "cyan"},
  columnspacing: 10,
  columnWidth: [25, 12, 10]
});
var main = function (data) {
  keySetting();
  if (_.isEmpty(data)) return console.log('No Results Found.');
  var moduleData = convertModuleData(data);
  var modulePercent = getModulePercent(moduleData);
  var methodData = convertMethodData(moduleData);
  var methodPercent = getMethodPercent(methodData);
  printMarkdown();
  printTree(moduleData);
  printModuleTable(moduleData, modulePercent);
  printModuleGauge(moduleData, modulePercent);
  printMethodTable(methodData, methodPercent);
  printMethodGauge(methodData, methodPercent);
  terminal.render();
};

var keySetting = function () {
  terminal.key(['escape', 'q', 'C-c'], function() {
    return process.exit(0);
  });
  terminal.key(['tab'],function () {
    if (terminal.focused === tree.rows) {
      moduleTable.focus();
    } else if (terminal.focused === moduleTable.rows) {
      methodTable.focus();
    } else if (terminal.focused === methodTable.rows) {
      tree.focus();
    }
  });
};

var convertModuleData = function(data) {
  if (!_.isArray(data)) return [];
  var sortedResult = _.chain(data).sortBy('count').reverse().value();
  return sortedResult;
};

var convertMethodData = function (moduleData) {
  var methods = _.map(moduleData, function (obj) {
    return _.map(obj.method, function (method) {
      return { name: obj.name + '.' +  method.name, count: method.count };
    });
  });
  methods = _.flatten(methods);
  methods = _.chain(methods).sortBy('count').reverse().value();
  return methods;
};

var getModulePercent = function (moduleData) {
  var data = _.pluck(moduleData, 'count');
  var moduleSum = _.reduce(data, function(memo, num) {
    return memo + num;
  }, 0);
  var modulePercent = _.map(data, function(num) {
    return (num / moduleSum ).toFixed(4);
  });
  return modulePercent;
};

var getMethodPercent = function (methods) {
  var methodSum = _.reduce(methods, function (memo, obj) {
    return memo + obj.count;
  },0);
  var methodPercent = _.map(methods, function (obj) {
    return (obj.count / methodSum ).toFixed(4);
  });
  return methodPercent;
};
var printMarkdown = function () {
  var markdown = grid.set(10, 0, 2, 2, contrib.markdown);
  terminal.append(markdown);
  var text = [
    '# NMV (Node Module Visualizer)',
    '**q**: quite NMV',
    '**tab**: next window',
    '**↑**: move up',
    '**↓**: move down'
  ].join('\n');
  markdown.setMarkdown(text);
};

var printTree = function (sortedResult) {
  var treeData = {
    name: 'Modules',
    extended: true,
    children: {}
  };
  _.each(sortedResult, function (obj) {
    treeData.children[obj.name] = {
      children: {}
    };
    obj.method = _.chain(obj.method).sortBy('count').reverse().value();
    _.each(obj.method, function (methodObj) {
      if (!methodObj.name) return;
      treeData.children[obj.name].children[methodObj.name] = {
        name: methodObj.name + '(' + methodObj.count + ')'
      };
    });
  });
   tree.focus();
   terminal.append(tree);
   tree.setData(treeData);
};

var printModuleTable = function (moduleData, modulePercent) {
  var moduleTableData = _.map(moduleData, function (obj, index) {
    return [ obj.name, obj.count, Math.floor(modulePercent[index] * 100 * 100 ) / 100 ];
  });
  terminal.append(moduleTable);
  moduleTable.setData({
    headers: ['', 'Module Require', 'Require %'],
    data: moduleTableData
  });
};

var printModuleGauge = function (moduleData, modulePercent) {
  var data = _.pluck(moduleData, 'count');
  var moduleGauge = _.map(data, function (num, index) {
    return { percent: modulePercent[index], stroke: theme[_.random(0, 4)] };
  });
  var gauge = grid.set(0, 2, 2, 5, contrib.gauge, {
    label: 'Module Bar Graph'
  });
  terminal.append(gauge);
  gauge.setStack(moduleGauge);
};

var printMethodTable = function (methodData, methodPercent) {
  var methodTableData = _.map(methodData, function (obj, index) {
    return [ obj.name, obj.count, Math.floor(methodPercent[index] * 100 * 100 ) / 100 ];
  });
  terminal.append(methodTable);
  methodTable.setData({
    headers: ['', 'Method Call', 'Call %'],
    data: methodTableData
  });
};

var printMethodGauge = function (methodData, methodPercent) {
  var methodGauge = _.map(methodData, function (num, index) {
    return { percent: methodPercent[index], stroke: theme[_.random(0, 4)] };
  });
  var gauge = grid.set(0, 7, 2, 5, contrib.gauge, {
    label: 'Method Bar Graph'
  });
  terminal.append(gauge);
  gauge.setStack(methodGauge);
};

module.exports = main;
