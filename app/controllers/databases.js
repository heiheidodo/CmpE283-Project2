'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const only = require('only');
const { respond, respondOrRedirect } = require('../utils');
const Database = mongoose.model('Database');
const assign = Object.assign;

/**
 * Load
 */

exports.load = async(function* (req, res, next, id) {
  try {
    req.database = yield Database.load(id);
    if (!req.database) return next(new Error('Database not found'));
  } catch (err) {
    return next(err);
  }
  next();
});

/**
 * List
 */

exports.index = async(function* (req, res) {
  const page = (req.query.page > 0 ? req.query.page : 1) - 1;
  const _id = req.query.item;
  const limit = 30;
  const options = {
    limit: limit,
    page: page
  };

  if (_id) options.criteria = { _id };

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

exports.new = function (req, res){
  res.render('databases/new', {
    title: 'New Database',
    database: new Database()
  });
};

/**
 * Create an database
 * Upload an image
 */

exports.create = async(function* (req, res) {
  const database = new Database(only(req.body, 'title body tags'));
  database.user = req.user;
  try {
    yield database.uploadAndSave(req.file);
    
    
    
    respondOrRedirect({ req, res }, `/databases/${database._id}`, database, {
      type: 'success',
      text: 'Successfully created database!'
    });
  } catch (err) {
    respond(res, 'databases/new', {
      title: database.title || 'New Database',
      errors: [err.toString()],
      database
    }, 422);
  }
});

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

exports.update = async(function* (req, res){
  const database = req.database;
  assign(database, only(req.body, 'title body tags'));
  try {
    yield database.uploadAndSave(req.file);
    respondOrRedirect({ res }, `/databases/${database._id}`, database);
  } catch (err) {
    respond(res, 'databases/edit', {
      title: 'Edit ' + database.title,
      errors: [err.toString()],
      database
    }, 422);
  }
});

/**
 * Show
 */

exports.show = function (req, res){
  respond(res, 'databases/show', {
    title: req.database.title,
    database: req.database
  });
};

/**
 * Delete an database
 */

exports.destroy = async(function* (req, res) {
  yield req.database.remove();
  respondOrRedirect({ req, res }, '/databases', {}, {
    type: 'info',
    text: 'Deleted successfully'
  });
});
