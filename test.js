'use strict';

(function () {
  require('./app/utils/mongodb').get({});
  require('./app/controllers/containers').test();
})();