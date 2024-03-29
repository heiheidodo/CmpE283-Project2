'use strict';

/*
 * Module dependencies.
 */

const users = require('../app/controllers/users');
const databases = require('../app/controllers/databases');
const comments = require('../app/controllers/comments');
const tags = require('../app/controllers/tags');
const auth = require('./middlewares/authorization');
// const webui = require('../app/controllers/webui');
const mongo_express = require('mongo-express/lib/middleware');

/**
 * Route middlewares
 */

const databaseAuth = [auth.requiresLogin, auth.database.hasAuthorization];
const commentAuth = [auth.requiresLogin, auth.comment.hasAuthorization];

const fail = {
  failureRedirect: '/login'
};

/**
 * Expose routes
 */

module.exports = function (app, passport) {
  const pauth = passport.authenticate.bind(passport);

  app.get('/testejs', function (req, res) {
    res.render('databases/testejs.ejs');
  });
  
  // user routes
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/logout', users.logout);
  app.post('/users', users.create);
  app.post('/users/session',
    pauth('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users.session);
  app.get('/users/:userId', users.show);
  app.get('/auth/facebook',
    pauth('facebook', {
      scope: [ 'email', 'user_about_me'],
      failureRedirect: '/login'
    }), users.signin);
  app.get('/auth/facebook/callback', pauth('facebook', fail), users.authCallback);
  app.get('/auth/github', pauth('github', fail), users.signin);
  app.get('/auth/github/callback', pauth('github', fail), users.authCallback);
  app.get('/auth/twitter', pauth('twitter', fail), users.signin);
  app.get('/auth/twitter/callback', pauth('twitter', fail), users.authCallback);
  app.get('/auth/google',
    pauth('google', {
      failureRedirect: '/login',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    }), users.signin);
  app.get('/auth/google/callback', pauth('google', fail), users.authCallback);
  app.get('/auth/linkedin',
    pauth('linkedin', {
      failureRedirect: '/login',
      scope: [
        'r_emailaddress'
      ]
    }), users.signin);
  app.get('/auth/linkedin/callback', pauth('linkedin', fail), users.authCallback);

  app.param('userId', users.load);

  // database routes
  app.param('id', databases.load);
  app.get('/databases', databases.index);
  app.get('/databases/new', auth.requiresLogin, databases.new);
  app.post('/databases', auth.requiresLogin, databases.create);
  app.get('/databases/:id', databases.show);
  app.get('/databases/:id/edit', databaseAuth, databases.edit);
  app.put('/databases/:id', databaseAuth, databases.update);
  app.delete('/databases/:id', databaseAuth, databases.destroy);
  // app.use('/databases/:id/ui', webui.setConfig);
  app.use('/databases/:id/webui', mongo_express(require('../app/values/mongo-express-config')));
  // app.use('/databases/:id/webui', webui.ui)
  
  // home route
  app.get('/', databases.index);

  // comment routes
  app.param('commentId', comments.load);
  app.post('/databases/:id/comments', auth.requiresLogin, comments.create);
  app.get('/databases/:id/comments', auth.requiresLogin, comments.create);
  app.delete('/databases/:id/comments/:commentId', commentAuth, comments.destroy);

  // tag routes
  app.get('/tags/:tag', tags.index);


  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }

    console.error(err.stack);

    if (err.stack.includes('ValidationError')) {
      res.status(422).render('422', { error: err.stack });
      return;
    }

    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res) {
    const payload = {
      url: req.originalUrl,
      error: 'Not found'
    };
    if (req.accepts('json')) return res.status(404).json(payload);
    res.status(404).render('404', payload);
  });
};
