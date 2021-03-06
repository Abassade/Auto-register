/* eslint-disable no-unused-vars */
/**
 * Created by osemeodigie on 06/10/2017.
 * objective: building to scale
 */

const config = require('../config/settings');

class MongoDBHelper {
  /**
   * The constructor
   *
   * @param mongodbClient - MongoDB client
   * @param mongodbModel - the model you wish to operate on
   */
  constructor(mongodbClient, mongodbModel) {
    this.mongodbClient = mongodbClient;
    this.mongodbModel = mongodbModel;
  }

  /**
   * Fetches a single record from the connected MongoDB instance.
   *
   * @param params
   * @returns {Promise}
   */
  get(params) {
    return new Promise((resolve, reject) => {
      const query = this.mongodbModel.findOne(params.conditions);

      if (params.fields) { query.select(params.fields); }

      if (params.populate && params.populate.length > 0) {
        params.populate.forEach((collection) => {
          query.populate({ path: collection.path, model: collection.model });
        });
      }

      return query.exec((err, modelData) => {
        if (err) {
          return reject(MongoDBHelper.handleError(err));
        }
        return resolve(modelData);
      });
    });
  }

  /**
   * Fetches a single record from the connected MongoDB instance.
   *
   * @param params
   * @returns {Promise}
   */
  getSorted(param) {
    return new Promise((resolve, reject) => {
      const query = this.mongodbModel.find({ $query: param, $orderby: { createdAt: -1 } });

      return query.exec((err, modelData) => {
        if (err) {
          return reject(MongoDBHelper.handleError(err));
        }
        return resolve(modelData);
      });
    });
  }

  /**
   * Fetches a single record from the connected MongoDB instance.
   * This uses the find().limit() instead of the findOne().
   * There is significant increase in performance...
   * A magnitude in the order of 2.
   * Ref: https://blog.serverdensity.com/checking-if-a-document-exists-mongodb-slow-findone-vs-find/
   *
   * @param params
   * @returns {Promise}
   */
  getOneOptimised(params) {
    return new Promise((resolve, reject) => {
      const query = this.mongodbModel.find(params.conditions).limit(1);
      if (params.fields) { query.select(params.fields); }

      if (params.populate && params.populate.length > 0) {
        params.populate.forEach((collection) => {
          query.populate({ path: collection.path, model: collection.model });
        });
      }

      return query.exec((err, modelData) => {
        if (err) {
          return reject(MongoDBHelper.handleError(err));
        }
        return resolve(modelData);
      });
    });
  }


  /**
   * Fetches bulk records from the connected MongoDB instance.
   *
   * @param params
   * @returns {Promise}
   */
  getBulk(params) {
    return new Promise((resolve, reject) => {
      const parameter = params;
      if (params && !parameter.limit) {
        // force the limit value from the environment variable to Int
        parameter.limit = parseInt(config.mongo.queryLimit.toString(), 10);
      }

      const query = params === undefined ? this.mongodbModel.find()
        : this.mongodbModel.find(parameter.conditions);

      if (params && parameter.fields) {
        query.select(params.fields);
      }
      if (params && parameter.distinct) {
        query.distinct(parameter.distinct);
      } else if (params) {
        query.limit(parameter.limit);
      }

      if (params && parameter.sort) {
        query.sort(parameter.sort);
      }

      if (params && parameter.populate && parameter.populate.length > 0) {
        parameter.populate.forEach((collection) => {
          query.populate({ path: collection.path, model: collection.model });
        });
      }

      return query.exec((error, modelData) => {
        if (error) {
          return reject(MongoDBHelper.handleError(error));
        }
        return resolve(modelData);
      });
    });
  }


  /**
   * Get Random records from the MongoDB instance.
   *
   * @param params
   * @returns {Promise}
   */
  getRandom(params) {
    return new Promise((resolve, reject) => this.mongodbModel.count(
      params.conditions,
      (err, count) => {
        if (err) {
          return reject(MongoDBHelper.handleError(err));
        }

        const rand = Math.floor(Math.random() * count);

        const query = this.mongodbModel.find(params.conditions).skip(rand).limit(2);

        if (params.fields) { query.select(params.fields); }

        if (params.populate && params.populate.length > 0) {
          params.populate.forEach((collection) => {
            query.populate({ path: collection.path, model: collection.model });
          });
        }

        return query.exec((inError, modelData) => {
          if (inError) {
            return reject(MongoDBHelper.handleError(inError));
          }
          return resolve(modelData);
        });
      },
    ));
  }

  /**
   * Get a Random Question from MongoDB while excluding already answered Questions
   */
  getRandomAndExclude(questionsToExclude, surveyId) {
    const params = {
      surveyId,
    };
    return new Promise((resolve, reject) => this.mongodbModel.count(
      params,
      (err, count) => {
        if (err) {
          return reject(MongoDBHelper.handleError(err));
        }
        const rand = Math.floor(Math.random() * count);
        // eslint-disable-next-line object-curly-newline
        const query = this.mongodbModel.find({
          surveyId, _id: { $nin: questionsToExclude } }).limit(1);

        return query.exec((inError, modelData) => {
          if (inError) {
            return reject(MongoDBHelper.handleError(inError));
          }
          return resolve(modelData);
        });
      },
    ));
  }


  /**
   * Count the number of RECORDS from the MongoDB instance's DB based on some conditional criteria
   *
   * @param params - the conditional parameters
   * @returns {Promise}
   */
  count(params) {
    return new Promise((resolve, reject) => this.mongodbModel.count(params.conditions,
      (error, response) => {
        if (error) {
          return reject(MongoDBHelper.handleError(error));
        }
        return resolve(response);
      }));
  }

  /**
     * Aggregates data within MongoDB by certain conditional criteria and returns same.
     * Typically used in report generation or logs...
     * But advisable to do logging/report aggregation on a stacked DB that is highly
     * optimised for search,.. E.g Elastic Search or GraphDB
     *
     * @param params
     * @returns {Promise}
     */
  aggregrate(params) {
    return new Promise((resolve, reject) => {
      const query = this.mongodbModel.aggregate(params.conditions);
      return query.exec((err, modelData) => {
        if (err) {
          return reject(MongoDBHelper.handleError(err));
        }
        return resolve(modelData);
      });
    });
  }


  /**
   * Saves data into the MongoDB instance
   *
   * @param data
   * @returns {Promise}
   */
  save(data) {
    return new Promise((resolve, reject) => {
      const mongodbSaveSchema = this.mongodbModel(data);
      return mongodbSaveSchema.save((error, result) => {
        if (error != null) {
          return reject(MongoDBHelper.handleError(error));
        }
        return resolve(result);
      });
    });
  }


  /**
   * Saves bulk data into the MongoDB instance
   *
   * @param data
   * @returns {Promise}
   */
  insertMany(data) {
    return new Promise((resolve, reject) => {
      const mongodbSaveSchema = this.mongodbModel;// (data);
      return mongodbSaveSchema.insertMany(data, (error, result) => {
        if (error != null) {
          return reject(MongoDBHelper.handleError(error));
        }
        return resolve(result);
      });
    });
  }


  /**
   * Updates a SINGLE RECORD in the MongoDB instance's DB based on some conditional criteria
   *
   * @param params - the conditional parameters
   * @param data - the data to update
   * @returns {Promise}
   */
  update(params, data) {
    return new Promise((resolve, reject) => this.mongodbModel.findOneAndUpdate(
      params.conditions,
      { $set: data },
      { new: true },
      (error, response) => {
        if (error) {
          if (config.logging.console) {
            return new Error(`Update Error: ${JSON.stringify(error)}`);
          }
          return reject(MongoDBHelper.handleError(error));
        }
        if (error == null && response == null) {
          return reject(new Error("Record Not Found In DB'"));
        }
        return resolve(response);
      },
    ));
  }


  /**
   * Updates MULTIPLE RECORDS within the MongoDB instance's DB based on some conditional criteria
   *
   * @param params - the conditional parameters
   * @param data - the data to update
   * @returns {Promise}
   */
  updateBulk(params, data) {
    return new Promise((resolve, reject) => this.mongodbModel.update(
      params.conditions,

      { $set: data },

      { new: true, multi: true }, (error, response) => { // {multi: true},
        if (error) {
          return reject(MongoDBHelper.handleError(error));
        }
        return resolve(response);
      },
    ));
  }


  /**
   * Delete MULTIPLE RECORDS from the MongoDB instance's DB based on some conditional criteria
   *
   * @param params - the conditional parameters
   * @returns {Promise}
   */
  deleteBulk(params) {
    return new Promise((resolve, reject) => this.mongodbModel.remove(params.conditions,
      (error, response) => {
        if (error) {
          return reject(MongoDBHelper.handleError(error));
        }
        return resolve(response);
      }));
  }


  /**
   * This closes the connection from this client to the running MongoDB database
   *
   * @returns {Promise}
   */
  close() {
    return new Promise((resolve, reject) => {
      this.mongodbClient.close();
      return resolve({
        error: false,
        msg: 'connection was successfully closed. Why So Serious, I am gone for a vacation!',
      });
    });
  }


  /**
   * Used to format the error messages returned from the MongoDB server during CRUD operations
   *
   * @param report
   * @returns {{error: boolean, message: *}}
   */
  static handleError(report) {
    return { error: true, msg: report };
  }
}

module.exports = MongoDBHelper;
