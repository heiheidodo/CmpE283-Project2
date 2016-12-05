'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const {wrap: async} = require('co');
const only = require('only');
const {respond, respondOrRedirect} = require('../utils');
const Database = mongoose.model('Database');
const assign = Object.assign;
const containers = require('./containers');
const log = require('../utils/log');
const util = require('../utils/util');
const mongo = require('../utils/mongodb');
const constants = require('../values/constants');

/**
 * Load
 */

exports.load = function (req, res, next, id) {
  mongo.get(id, constants.DATABASE).spread(function (database) {
    req.database = database;
    if (!req.database) return next(new Error('Database not found'));
    next();
  }).catch(function (err) {
    return next(err);
  });
};

/**
 * List
 */

exports.index = async(function*(req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const _id = req.query.item;
  const limit = 30;
  const options = {
    limit: limit,
    page: page
  };

  if (_id) options.criteria = {_id};

  const databases = yield Database.list(options);
  const count = yield Database.count();

  respond(res, 'databases/index', {
    title: 'Databases',
    databases: databases,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});

/**
 * New database
 */

exports.new = function (req, res) {
  res.render('databases/new', {
    title: 'New Database',
    database: new Database()
  });
};

/**
 * Create an database
 * Upload an image
 */

exports.create = function (req, res) {
  var database = {};
  database.title = req.body.title;
  database.body = req.body.body;
  database.uid = req.user._id;
  database.user = req.user.toObject();
  log.i(database);

  containers.create(database).then(function (database) {
    respondOrRedirect({req, res}, `/databases/${database._id}`, database, {
      type: 'success',
      text: 'Successfully created database!'
    });
  }).catch(function (err) {
    respond(res, 'databases/new', {
      title: database.title || 'New Database',
      errors: [err.toString()],
      database
    }, 422);
  });

};

/**
 * Edit an database
 */

exports.edit = function (req, res) {
  res.render('databases/edit', {
    title: 'Edit ' + req.database.title,
    database: req.database
  });
};

/**
 * Update database
 */

exports.update = function (req, res) {
  const database = req.database;
  assign(database, only(req.body, 'title body tags'));
  mongo.put(database, constants.DATABASE).then(function (db) {
    respondOrRedirect({res}, `/databases/${database._id}`, db);
  }).catch(function (err) {
    respond(res, 'databases/edit', {
      title: 'Edit ' + database.title,
      errors: [err.toString()],
      database
    }, 422);
  });
};

/**
 * Show
 */

exports.show = function (req, res) {
  respond(res, 'databases/show', {
    title: req.database.title,
    database: req.database
  });
};

/**
 * Delete an database
 */

exports.destroy = function (req, res) {
  log.req(req);
  containers.delete(req.database).then(function () {
    respondOrRedirect({req, res}, '/databases', {}, {
      type: 'info',
      text: 'Deleted successfully'
    });
  }).catch(function (err) {
    log.e(err);
    respondOrRedirect({req, res}, '/databases', {}, {
      type: 'error',
      text: 'Delete failed'
    });
  });
};
