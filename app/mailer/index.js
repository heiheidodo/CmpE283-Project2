'use strict';

/**
 * Module dependencies.
 */

const Notifier = require('notifier');
const jade = require('jade');
const config = require('../../config');

/**
 * Process the templates using swig - refer to notifier#processTemplate method
 *
 * @param {String} tplPath
 * @param {Object} locals
 * @return {String}
 * @api public
 */

Notifier.prototype.processTemplate = function (tplPath, locals) {
  locals.filename = tplPath;
  return jade.renderFile(tplPath, locals);
};

/**
 * Expose
 */

module.exports = {

  /**
   * Comment notification
   *
   * @param {Object} options
   * @param {Function} cb
   * @api public
   */

  comment: function (options, cb) {
    const database = options.database;
    const author = database.user;
    const user = options.currentUser;
    const notifier = new Notifier(config.notifier);

    const obj = {
      to: author.email,
      from: 'your@product.com',
      subject: user.name + ' added a comment on your database ' + database.title,
      alert: user.name + ' says: "' + options.comment,
      locals: {
        to: author.name,
        from: user.name,
        body: options.comment,
        database: database.name
      }
    };

    // for apple push notifications
    /*notifier.use({
      APN: true
      parseChannels: ['USER_' + author._id.toString()]
    })*/

    try {
      notifier.send('comment', obj, cb);
    } catch (err) {
      console.log(err);
    }
  }
};
