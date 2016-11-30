'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const Database = mongoose.model('Database');
const User = mongoose.model('User');
const co = require('co');

/**
 * Clear database
 *
 * @param {Object} t<Ava>
 * @api public
 */

exports.cleanup = function (t) {
  co(function* () {
    yield User.remove();
    yield Database.remove();
    t.end();
  });
};
