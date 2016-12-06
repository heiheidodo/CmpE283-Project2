'use strict';
const mongo_express = require('mongo-express/lib/middleware');
const router = require('mongo-express/lib/router');
const util = require('../utils/util');
const log = require('../utils/log');
const mongo_express_config = require('../values/mongo-express-config');
var app = require('../../server');
const Promise = require('bluebird');
const writeFile = Promise.promisify(require('fs').writeFile);
const unlink = Promise.promisify(require('fs').unlink);
const exec = Promise.promisify(require('child_process').exec);


const readFile = Promise.promisify(require("fs").readFile);
let TEMPLATE = undefined;
const HOST_PORT = '___HOST_PORT___';
const targetPath = '/usr/local/lib/node_modules/mongo-express/config.js';

function init() {
  if (TEMPLATE) {
    return Promise.bind({});
  }
  return readFile('app/raw/mongo-express-config-template.js', 'utf8').then(function (data) {
    TEMPLATE = data;
  });
}

let ui = mongo_express(mongo_express_config);
exports.ui = ui;
exports.config = mongo_express_config;

var proc;

exports.setConfig = function (req, res, next) {
  let config = util.copy(mongo_express_config);
  config.mongodb.server = req.database.dns || 'localhost';
  config.mongodb.port = req.database.port || 27017;
  config.mongodb.username = req.database.username || '';
  config.mongodb.password = req.database.password || '';
  log.i('setConfig');
  log.i(config);

  // init().then(function () {
  //   return unlink(targetPath)
  // }).then(function () {
  //   let configjs = TEMPLATE.replace('___HOST___', config.mongodb.server);
  //   configjs = TEMPLATE.replace('___PASSWORD___', config.mongodb.password);
  //   configjs = TEMPLATE.replace('___PORT___', config.mongodb.port);
  //   configjs = TEMPLATE.replace('___USER___', config.mongodb.username);
  //   return writeFile(targetPath, configjs);
  // }).then(function () {
  //   if (proc) {
  //     proc.kill('SIGINT');
  //   }
  //   proc = require('child_process').spawn('mongo-express');
  // }).then(function () {
  //   const url = '/databases/' + req.database._id + '/webui';
  //   res.redirect('localhost:8081');
  // });

  // removeRoute(app, '/')
  // ui.use('/', router(config));
  //
  const url = '/dfewafe';
  // const url = '/databases/' + req.database._id + '/webui';
  // app.get(url, mongo_express(mongo_express_config));
  app.get(url, function (req, res) {
    res.send('heeejofe')
  });
  log.i(app.hello);
  res.redirect(url);
};
