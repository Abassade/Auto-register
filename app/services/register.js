/* eslint-disable consistent-return */
/**
 * created by Abass 09-02-2019
 */

// const config = require('../config/settings');
// const utility = require('../lib/utils');
const registerModel = require('../models/register');
const MongoDBHelper = require('./mongoHelper');

class Register {
  /**
     *
     * @param {*} logger
     * @param {*} mongoClient
     * @param {*} redis
     */
  constructor(logger, redisClient, mongoClient) {
    this.logger = logger;
    this.redisClient = redisClient;
    this.mongoClient = new MongoDBHelper(mongoClient, registerModel);
  }

  /**
     * @param {*} key
     */
  checkRedis(key) {
    return new Promise((resolve, reject) => {
      this.redisClient.exists(key, (err, reply) => {
        if (!err) {
          resolve(reply);
        }
        if (err) {
          reject(err);
          return this.logger.info('error while checking redis', err);
        }
      });
    });
  }

  /**
     * @param {*} key
     * @param {*} data
     */
  saveToRedis(key, data) {
    this.logger.info('IN-COMING DATA TYPE', typeof (data));
    return new Promise((resolve) => {
      this.redisClient.set(key, data);
      resolve('msisdn set');
    });
  }

  deleteKeyFromRedis(key) {
    return new Promise((resolve, reject) => {
      this.redisClient.del(key, (err, res) => {
        if (err) {
          reject(err);
        }
        if (res === 1) {
          resolve(`deleted msisdn: ${key}`);
        } else if (res === 0) {
          resolve(`unable t delete the msisdn: ${key}`);
        }
      });
    });
  }

  getAllDataFromDB() {
    return this.mongoClient.getBulk();
  }

  /**
     * @param {*} data
     */
  saveToMongoDB(data) {
    this.logger.info('IN-COMING DATA', data);
    return this.mongoClient.save(data);
  }
}
module.exports = Register;
