'use strict';

/**
 * Module dependencies.
 */

const mongoose = require('mongoose');
const { wrap: async } = require('co');
const { respond } = require('../utils');
const Database = mongoose.model('Database');

/**
 * List items tagged with a tag
 */

exports.index = async(function* (req, res) {
  const criteria = { tags: req.params.tag };
  const page = (req.params.page > 0 ? req.params.page : 1) - 1;
  const limit = 30;
  const options = {
    limit: limit,
    page: page,
    criteria: criteria
  };

  const databases = yield Database.list(options);
  const count = yield Database.count(criteria);

  respond(res, 'databases/index', {
    title: 'Databases tagged ' + req.params.tag,
    databases: databases,
    page: page + 1,
    pages: Math.ceil(count / limit)
  });
});
