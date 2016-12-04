"use strict";
const Promise = require('bluebird');
const mongodb = Promise.promisifyAll(require('mongodb'));
const MongoClient = mongodb.MongoClient;
const assert = require('assert');
const log = require('../utils/log');
const util = Promise.promisifyAll(require('../utils/util'));
const _ = require('underscore');
const DEFAULT_COLLECTION = 'app_default';
const DEFAULT_DB_URL = 'mongodb://localhost/noobjs_dev';

function Mongo() {
  var db;

  function init() {
    if (db) {
      return Promise.bind({});
    }
    return MongoClient.connectAsync(process.env.MONGO_URL || DEFAULT_DB_URL).then(function (database) {
      db = database;
      return test();
    });
  }

  this.getDB = function () {
    return init().then(function () {
      return db;
    });
  };

  this.collection = function (name) {
    return init().then(function () {
      return db.collection(name);
    });
  };

  function objectId(id) {
    if (id instanceof mongodb.ObjectID) {
      return id;
    }
    try {
      return new mongodb.ObjectID(id);
    } catch (err) {
      // log.v('not a objectID, id = ', id);
    }
  }

  this.objectId = objectId;

  this.put = function (object, collection, cb) {
    if (cb) {
      return init().then(function () {
        return put(key, collection);
      }).then(function (result) {
        cb(null, result);
      }, function (err) {
        cb(err, undefined);
      })
    }
    return init().then(function () {
      return put(object, collection);
    });
  };

  function put(object, collection) {
    if (typeof collection === 'undefined') {
      collection = DEFAULT_COLLECTION;
    }
    // log.v('put(), object = ', object, ', collection = ', collection);

    if (object._id) {
      return update(collection, {_id: objectId(object._id)}, object);
    }

    if (!object._key) {
      return insert(collection, object);
    }

    return get(object._key, collection).spread(function (result) {
      log.v('put, search key = ', object._key, ', result = ', result);
      if (result) {
        return update(collection, {_key: object._key}, object);
      } else {
        return insert(collection, object);
      }
    });
  };

  function containsID(key) {
    return key instanceof mongodb.ObjectID || key instanceof String
      || (typeof key === typeof {} && (key._id || key._key));
  }

  function getByIDs(ids, collection) {
    return new Promise(function (resolve) {
      var objects = util.fixedLengthObject(ids.length, function () {
        resolve(objects);
      });
      ids.forEach(function (id) {
        get(id, collection).spread(function (doc) {
          objects.put(id, doc);
        });
      });
    });
  }

  function get(key, collection) {
    if (typeof collection === 'undefined') {
      collection = DEFAULT_COLLECTION;
    }

    if (key instanceof Array) {
      // log.v();
      return getByIDs(key, collection);
    }

    if (objectId(key)) {
      // log.v();
      return db.collection(collection).find({_id: objectId(key)}).limit(1).toArrayAsync();
    }

    if (util.isString(key)) {
      // log.v();
      return db.collection(collection).find({_key: key}).limit(1).toArrayAsync();
    }
    // log.v('key = ', key, ', collection = ', collection);
    return db.collection(collection).find(key).toArrayAsync();
  }

  this.get = function (key, collection, refs) {
    // if (cb) {
    //     return init().then(function () {
    //         return get(key, collection);
    //     }).then(function (result) {
    //         cb(null, result);
    //     }, function (err) {
    //         cb(err, undefined);
    //     })
    // }
    return init().then(function () {
      if (refs) {
        return getDetailed(key, collection, refs);
      }
      return get(key, collection);
    })
  };

  this.remove = function (key, collection, cb) {
    // if (cb) {
    //     return init().then(function () {
    //         return remove(key, collection);
    //     }).then(function (result) {
    //         cb(null, result);
    //     }, function (err) {
    //         cb(err, undefined);
    //     })
    // }
    return init().then(function () {
      return remove(key, collection);
    })
  };

  function remove(key, collection) {
    if (typeof collection === 'undefined') {
      collection = DEFAULT_COLLECTION;
    }

    if (objectId(key)) {
      // log.v();
      return db.collection(collection).deleteOneAsync({_id: objectId(key)});
    }

    if (util.isString(key)) {
      // log.v();
      return db.collection(collection).deleteOneAsync({_key: key});
    }

    return db.collection(collection).deleteManyAsync(key);
  };

  function insert(collection, object) {
    //log.v('insert(), collection = ', collection, ', object = ', object);
    return db.collection(collection).insertOneAsync(object).then(function (result) {
      object._id = result.insertedId;
      return object;
    });
  }

  function update(collection, where, object) {
    object = util.copy(object);
    if (object._id) {
      delete object._id;
    }
    if (containsID(where)) {
      return db.collection(collection).updateOneAsync(where, object).then(function () {
        return object;
      });
    } else {
      return db.collection(collection).updateAsync(where, object).then(function () {
        return object;
      });
    }
  }

  function getDetailed(key, collection, refs) {
    // log.v('key = ', key, ', collection = ', collection, ', refs = ', refs);
    var inflatedObjects = [];
    return mongo.get(key, collection).then(function (objects) {
      return Promise.each(objects, function (object) {
        log.v('inflate object = ', object);
        return mongo.inflate(object, refs).then(function (inflatedObject) {
          log.v('inflated object = ', inflatedObject);
          inflatedObjects.push(inflatedObject);
        });
      });
    }).then(function () {
      return inflatedObjects;
    });
  }

  this.getDetailed = getDetailed;

  this.inflate = function (object, refs) {
    var copy = {};
    return Promise.each(_.keys(object), function (attr) {
      // log.v('attr = ', attr);
      if (util.isFunction(object[attr])) {
        log.v('inflate, skip, fun');
        return;
      }
      copy[attr] = object[attr];
      if (mongo.objectId(object[attr])
        && attr.toLowerCase().endsWith('id')
        && object[attr].toString() !== object._id.toString()) {
        var resName = attr.toLowerCase().endsWith('id') ? attr.substring(0, attr.length - 'id'.length) : attr;
        // log.v('resName = ', resName);
        return mongo.get(object[attr], (refs && refs[attr]) || resName).spread(function (res) {
          // log.v('inflate, resName = ', resName, ', res = ', res);
          if (res) {
            copy[resName] = res;
          }
        })
      }
    }).then(function () {
      // log.v('inflate, copy = ', copy);
      return copy;
    });
  };

  function toFilter(obj) {
    if (util.empty(obj)) {
      return {};
    }
    var where = {$and: []};
    for (var attr in obj) {
      var condition = {};
      condition[attr] = obj[attr];
      where.$and.push(condition);
    }
    return where;
  }

  this.toFilter = toFilter;


  function test() {
    var obj = {opr: 'insert'};
    var ids = [];
    const TEST = 'test';
    return mongo.remove({}, TEST).then(function (result) {
      log.v('drop collection, result = ', result);
      return mongo.put({opr: 'insert'}, TEST);
    }).then(function (result) {
      log.v('put, result = ', result);
      assert(result._id);
      assert(result.opr === 'insert');
      obj.opr = 'update';
      obj._key = 'hello';
      return mongo.put(obj, TEST);
    }).then(function (result) {
      log.v('update, result = ', result);
      assert(result._key === 'hello');
      assert(result.opr === 'update');
      return mongo.get('hello', TEST);
    }).spread(function (result) {
      log.v('get, result = ', result);
      assert(result.opr === 'update');
      return mongo.remove('hello', TEST);
    }).then(function (result) {
      log.v('remove, result = ', result);
      return mongo.get('hello', TEST);
    }).spread(function (result) {
      log.v('remove, get, result = ', result);
      assert(!result);
      return mongo.put({opr: '1'}, TEST);
    }).then(function (result) {
      ids.push(result._id);
      return mongo.put({opr: '2'}, TEST)
    }).then(function (result) {
      ids.push(result._id);
      return mongo.get(ids, TEST);
    }).then(function (objects) {
      log.v('objects = ', objects);
      assert(objects[ids[0]]['opr'] == 1);
      assert(objects[ids[1]]['opr'] == 2);
      return mongo.put({testName: 'test inflate'}, TEST);
    }).then(function (user) {
      return mongo.put({name: 'product', testID: user._id}, TEST);
    }).then(function (product) {
      log.v('before inflate, product = ', product);
      return mongo.inflate(product);
    }).then(function (product) {
      log.v('after inflate, product = ', product);
      assert(product.test.testName === 'test inflate');
    }).then(function () {
    });
  }
}

var mongo = new Mongo();
mongo.log = false;
module.exports = mongo;
