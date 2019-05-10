/**
 * Created by Abass Makinde on 11/03/2019.
 */
const winston = require('winston');
const morgan = require('morgan');
const bluebird = require('bluebird');
const mongoose = require('mongoose');
const redis = require('redis');
const config = require('../config/settings');
const serviceLocator = require('../lib/serviceLocator');

const RegisterService = require('../services/register');
const RegisterController = require('../controllers/register');
/**
 * Returns an instance of logger for the App
 */
serviceLocator.register('logger', () => {
  const consoleTransport = new (winston.transports.Console)({
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    json: false,
    colorize: true,
    level: process.env.ENV === 'development' ? 'debug' : 'info',
  });
  const transports = [consoleTransport];
  return winston.createLogger({
    transports,
  });
});

/**
 * Returns a Redis connection instance
 */
serviceLocator.register('redis', (servicelocator) => {
  const logger = servicelocator.get('logger');
  bluebird.promisifyAll(redis.RedisClient.prototype);
  bluebird.promisifyAll(redis.Multi.prototype);
  const redisInstance = redis.createClient({
    host: config.redisHost,
    port: config.redisPort,
    db: config.redisDB,
    no_ready_check: true,
  });

  redisInstance.on('connect', () => {
    logger.info('Redis is connected', config.redisDB);
  });

  redisInstance.on('error', (err) => {
    logger.error(`Connection error : ${err}`);
    redisInstance.quit();
    process.exit(1);
  });

  redisInstance.on('end', (err) => {
    logger.error(`Redis is shutting down : ${err}`);
    process.exit(1);
  });

  // If the Node process ends, close the Redis connection
  process.on('SIGINT', () => {
    redisInstance.quit();
    process.exit(0);
  });

  return redisInstance;
});

serviceLocator.register('mongo', (servicelocator) => {
  const logger = servicelocator.get('logger');
  const connectionString = (!config.mongo.connection.username || !config.mongo.connection.password)
    ? `mongodb://${config.mongo.connection.host}:${config.mongo.connection.port}/${config.mongo.connection.dbProd}`
    : `mongodb://${config.mongo.connection.username}:${config.mongo.connection.password}`
      + `@${config.mongo.connection.host}:${config.mongo.connection.port}/${config.mongo.connection.dbProd}`;
  mongoose.Promise = bluebird;
  const mongo = mongoose.connect(connectionString)
    .then(() => {
      logger.info('Mongo Connection Established');
    }).catch((err) => {
      logger.error(`Mongo Connection Error : ${err}`);
    });
  // mongo.connection.on('connected', () => {
  //   logger.info('Mongo Connection Established');
  // });
  // mongo.connection.on('error', (err) => {
  //   logger.error(`Mongo Connection Error : ${err}`);
  //   process.exit(1);
  // });
  // mongo.connection.on('disconnected', () => {
  //   logger.error('Mongo Connection disconnected');
  //   process.exit(1);
  // });

  // // If the Node process ends, close the Mongoose connection
  // process.on('SIGINT', () => {
  //   mongo.connection.close(() => {
  //     logger.error('Mongoose default connection disconnected through app termination');
  //     process.exit(0);
  //   });
  // });

  return mongo;
});

/**
 * Returns an instance of HTTP requests logger
 */
serviceLocator.register('requestlogger', () => morgan('common'));


// Servive instance
serviceLocator.register('RegisterService', () => {
  const logger = serviceLocator.get('logger');
  const redisClient = serviceLocator.get('redis');
  const mongoClient = serviceLocator.get('mongo');
  return new RegisterService(logger, redisClient, mongoClient);
});

// Controller instance
// eslint-disable-next-line no-shadow
serviceLocator.register('RegisterController', (serviceLocator) => {
  const logger = serviceLocator.get('logger');
  const service = serviceLocator.get('RegisterService');
  return new RegisterController(logger, service);
});

module.exports = serviceLocator;
