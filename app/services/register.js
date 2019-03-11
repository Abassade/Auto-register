/* eslint-disable consistent-return */
/**
 * created by Abass 09-02-2019
 */

// const config = require('../config/settings');
// const utility = require('../lib/utils');

class Register {
  /**
     *
     * @param {*} logger
     * @param {*} brandService
     * @param {*} elasticSearch
     * @param {*} redis
     */
  constructor(logger, redisClient) {
    this.logger = logger;
    this.redisClient = redisClient;
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

    return this.redisClient.set(key, data);
  }
}
module.exports = Register;
