'use strict';
const util = require('../utils/util');
const Promise = require('bluebird');
const AWS = require('aws-sdk');
const log = require('../utils/log');
const constants = require('../values/constants');
const mongo = require('../utils/mongodb');
const MIN_PORT = 500;
AWS.config.update(({region: 'us-west-2'}));
const ecs = new AWS.ECS();
const ec2 = new AWS.EC2();
const CLUSTER = 'mongo-cluster';

const readFile = Promise.promisify(require("fs").readFile);
let TEMPLATE = undefined;
const HOST_PORT = '___HOST_PORT___';

function init() {
  if (TEMPLATE) {
    return Promise.bind({});
  }
  // AWS.config.update(({region:'us-west-2'}));
  AWS.config.loadFromPath('app/raw/aws.json');
  return readFile('app/raw/mongo-task-template.json', 'utf8').then(function (data) {
    TEMPLATE = data;
  });
}

function registerTask(task) {
  log.i(task);
  return new Promise(function (resolve, reject) {
    ecs.registerTaskDefinition(JSON.parse(task), function (err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(util.objectify(data));
    })
  });
}

function runTask(database) {
  log.i(database);
  return new Promise(function (resolve, reject) {
    let runConfig = {
      taskDefinition: database.task.family + ':' + database.task.revision,
      cluster: CLUSTER,
    };
    log.i('runConfig: ', runConfig);
    ecs.runTask(runConfig, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(util.objectify(data));
    })
  });
}

function describeContainer(params) {
  log.i(params);
  return new Promise(function (resolve, reject) {
    ecs.describeContainerInstances(params, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(util.objectify(data));
    })
  })
}

function describeEC2(params) {
  log.i(params);
  return new Promise(function (resolve, reject) {
    ec2.describeInstances(params, function (err, data) {
      if (err) {
        return reject(err);
      }
      resolve(util.objectify(data));
    });
  });
}

function getLatestDB() {
  return mongo.collection(constants.DATABASE).then(function (collection) {
    return collection.find({}).sort({port: -1}).limit(1).toArrayAsync();
  });
}

exports.create = function (database) {
  log.i('database: ');
  log.i(database);
  return init().then(function () {
    return getLatestDB();
  }).spread(function (latestDB) {
    log.i(latestDB);

    // get port
    database.port = latestDB ? (latestDB.port || MIN_PORT) + 1 : MIN_PORT;
    const task = TEMPLATE.replace(HOST_PORT, database.port);

    return registerTask(task);
  }).then(function (task) {

    // register result
    log.i('register result: ', task);
    database.task = {
      family: task.taskDefinition.family,
      revision: task.taskDefinition.revision
    };

    return runTask(database);
  }).then(function (result) {

    // run result
    log.i('runResult: ', result);
    if (result.tasks.length == 0){
      throw 'failed to create instance, ' + failures[0].reason;
    }
    database.containerID = getContainerId(result.tasks[0].containerInstanceArn);
    var params = {
      cluster: CLUSTER,
      containerInstances: [database.containerID]
    };
    log.i('describe container: ', params);

    return describeContainer(params);
  }).then(function (container) {

    // get container desc
    log.i('container: ', container);
    database.ec2ID = container.containerInstances[0].ec2InstanceId;
    var params = {
      InstanceIds: [database.ec2ID]
    };

    return describeEC2(params);
  }).then(function (ec2Result) {

    // get ec2 desc
    log.i('ec2: ', ec2Result);
    database.dns = ec2Result.Reservations[0].Instances[0].PublicDnsName;
    log.i('database: ');
    log.i(database);
    return mongo.put(database, constants.DATABASE);
  }).then(function (database) {

    log.i('inserted database: ');
    log.i(database);
    return database;
  }).catch(function (err) {

    if (err.stack) {
      log.e(err.stack);
    } else {
      log.e(err);
    }
    return new Promise.reject(err);
  });
};

function getContainerId(containerInstanceArn) {
  return containerInstanceArn.substring(containerInstanceArn.lastIndexOf('/') + 1);
}

exports.test = function () {
  // exports.create({});
};