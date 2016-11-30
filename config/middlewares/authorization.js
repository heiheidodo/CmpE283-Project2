'use strict';

/*
 *  Generic require login routing middleware
 */

exports.requiresLogin = function (req, res, next) {
  if (req.isAuthenticated()) return next();
  if (req.method == 'GET') req.session.returnTo = req.originalUrl;
  res.redirect('/login');
};

/*
 *  User authorization routing middleware
 */

exports.user = {
  hasAuthorization: function (req, res, next) {
    if (req.profile.id != req.user.id) {
      req.flash('info', 'You are not authorized');
      return res.redirect('/users/' + req.profile.id);
    }
    next();
  }
};

/*
 *  Database authorization routing middleware
 */

exports.database = {
  hasAuthorization: function (req, res, next) {
    if (req.database.user.id != req.user.id) {
      req.flash('info', 'You are not authorized');
      return res.redirect('/databases/' + req.database.id);
    }
    next();
  }
};

/**
 * Comment authorization routing middleware
 */

exports.comment = {
  hasAuthorization: function (req, res, next) {
    // if the current user is comment owner or database owner
    // give them authority to delete
    if (req.user.id === req.comment.user.id || req.user.id === req.database.user.id) {
      next();
    } else {
      req.flash('info', 'You are not authorized');
      res.redirect('/databases/' + req.database.id);
    }
  }
};
