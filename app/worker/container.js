'use strict';
const util = require('../utils');
const AWS = require('aws-sdk');
const Promise = require('bluebird');
var readFile = Promise.promisify(require("fs").readFile);

function init() {
  AWS.config.loadFromPath('../../raw/aws.json');
  return readFile('../../raw/mongo-task-template')  
}

exports.create = function () {
  AWS.ECS.registerTaskDefinition()
};