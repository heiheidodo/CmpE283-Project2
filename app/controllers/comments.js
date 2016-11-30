'use strict';

/**
 * Module dependencies.
 */

const { wrap: async } = require('co');
const { respondOrRedirect } = require('../utils');

/**
 * Load comment
 */

exports.load = function (req, res, next, id) {
  req.comment = req.database.comments
    .find(comment => comment.id === id);
    
  if (!req.comment) return next(new Error('Comment not found'));
  next();
};

/**
 * Create comment
 */

exports.create = async(function* (req, res) {
  const database = req.database;
  yield database.addComment(req.user, req.body);
  respondOrRedirect({ res }, `/databases/${database._id}`, database.comments[0]);
});

/**
 * Delete comment
 */

exports.destroy = async(function* (req, res) {
  yield req.database.removeComment(req.params.commentId);
  req.flash('info', 'Removed comment');
  res.redirect('/databases/' + req.database.id);
  respondOrRedirect({ req, res }, `/databases/${req.database.id}`, {}, {
    type: 'info',
    text: 'Removed comment'
  });
});
