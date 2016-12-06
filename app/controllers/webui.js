'use strict';
const mongo_express = require('../../mongo-express/lib/middleware');
const router = require('mongo-express/lib/router');
const util = require('../utils/util');
const log = require('../utils/log');
const mongo_express_config = require('../values/mongo-express-config');

let ui = mongo_express(mongo_express_config);
exports.ui = ui;
exports.config = mongo_express_config;

exports.setConfig = function (req, res, next) {
  let config = util.copy(mongo_express_config);
  config.mongodb.server = req.database.dns || 'localhost';
  config.mongodb.port = req.database.port || 27017;
  config.mongodb.username = req.database.username || '';
  config.mongodb.password = req.database.password || '';
  log.i('setConfig');
  log.i(config);

  ui.rt.setDB(config).then(function () {
    next();
  });
};
