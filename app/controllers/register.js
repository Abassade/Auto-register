/* eslint-disable no-use-before-define */
/* eslint-disable no-shadow */
/* eslint-disable consistent-return */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/**
 * created by Abass 11|03|2019
 * objective: building to scale
 */

const multer = require('multer');
const unirest = require('unirest');
const httpStatus = require('../constant/httpStatus');
const Response = require('../constant/reponse');
const config = require('../config/settings');

const s3Url = config.s3UploadUrl;
const s3BucketID = config.s3BucketId;

const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, __dirname);
  },
  filename(req, file, callback) {
    callback(null, `${file.fieldname}-${Date.now()}`);
  },
});
const upload = multer({ storage }).single('RegisterMedia');


class Register {
  /**
     *
     * @param {*} logger
     * @param {*} registerService
     */
  constructor(logger, registerService) {
    this.logger = logger;
    this.registerService = registerService;
  }

  getAllRawData(req, res) {
    this.logger.info('req body passed', req.body);
    this.registerService.getAllDataFromDB()
      .then(data => Response.success(res, {
        message: 'data fetched succesfully',
        response: data,
      }, httpStatus.OK));
  }


  saveDetail(req, res) {
    this.logger.info('request', req.body);
    const { msisdn, cardType } = req.body;
    const CARD_TYPE = ['VOTER', 'NIMS'];
    const allPassedData = req.body;
    if (!msisdn || !req.files.IDcard || !req.files.passportPhoto || !cardType) {
      return Response.failure(res, {
        error: true,
        message: 'Please msisdn, cardType IDcard, and passportPhoto must be passed!!',
      }, httpStatus.BadRequest);
    }
    if (cardType && !(CARD_TYPE.indexOf(cardType) > -1)) {
      return Response.failure(res, {
        error: true,
        message: 'non compatible cardType passed, try one of [VOTER, NIMS]',
      }, httpStatus.BadRequest);
    }

    if (msisdn.toString().trim() === '' || cardType.toString().trim() === ''
     || msisdn.toString().trim().length !== 11) {
      this.logger.info('msisdn and cardType must not be empty');
      return Response.failure(res, {
        error: true,
        message: 'msisdn must not be empty and it must be of length 11 e.g. 08084745877\n cardType is also required',
      }, httpStatus.BadRequest);
    }

    const checkIfExists = msisdn;

    this.registerService.checkRedis(checkIfExists)
      .then((reply) => {
        if (reply === 1) {
          this.logger.info('A user with this msisdn already exists');
          return Response.success(res, {
            message: `A user with the msisdn ${msisdn} already exists`,
            response: [],
          }, httpStatus.OK);
        }
        if (reply === 0) {
          const sanitizedMsidn = `+234${msisdn.substr(1)}`;
          allPassedData.msisdn = sanitizedMsidn;
          allPassedData.cardType = cardType;
          this.registerService.saveToRedis(msisdn, sanitizedMsidn)
            .then((message) => {
              upload(req, res, (err) => {
                if (err) {
                  res.json({ error_code: 1, err_desc: err });
                  return;
                }
                /** Multer gives us file info in req.file object */
                if (!req.files) {
                  res.json({ error_code: 1, err_desc: 'No file passed' });
                  return;
                }

                unirestuploader(req.files.IDcard, this)
                  .then((data) => {
                    allPassedData.IDcard = data;

                    unirestuploader(req.files.passportPhoto, this)
                      .then((data) => {
                        allPassedData.passportPhoto = data;
                        const dataToSave = {
                          msisdn: allPassedData.msisdn,
                          cardType: allPassedData.cardType,
                          IDcard: allPassedData.IDcard,
                          passportPhoto: allPassedData.passportPhoto,
                        };
                        // TODO =>>> save all the raw data to a database, ensure you delete the msisdn from redis if not saved
                        // TODO =>>> push data to queue (rabbitMQ)
                        this.logger.info(`All saved data =>>> ${JSON.stringify(dataToSave)}`);
                        this.registerService.saveToMongoDB(dataToSave)
                          .then(data => Response.success(res, {
                            message: 'Data successfully saved',
                            response: data,
                          }, httpStatus.OK))
                          .catch((error) => {
                            // delete msisdn from redis
                            this.registerService.deleteKeyFromRedis(msisdn)
                              .then((data) => {
                                this.logger.info(`msisdn: ${data} deleted`);
                              }).catch((err) => {
                                this.logger.info('error while deleting', err);
                              });
                            return Response.failure(res, { error: true, message: error }, httpStatus.BadRequest);
                          });
                      }).catch((err) => {
                        // TODO delete the msisdn from redis
                        this.registerService.deleteKeyFromRedis(msisdn)
                          .then((data) => {
                            this.logger.info(`msisdn: ${data} deleted`);
                          }).catch((err) => {
                            this.logger.info('error while deleting', err);
                          });
                        this.logger.info('error', err);
                      });
                  }).catch((err) => {
                    // TODO delete the msisdn from redis
                    this.registerService.deleteKeyFromRedis(msisdn)
                      .then((data) => {
                        this.logger.info(`msisdn: ${data} deleted`);
                      }).catch((err) => {
                        this.logger.info('error while deleting', err);
                      });
                    this.logger.info('error', err);
                  });
              });
            });
        }
      })
      .catch((err) => {
        this.logger.info('error: ', err);
        return Response.failure(res, {
          message: 'error from redis',
          response: err,
        }, httpStatus.Conflict);
      });

    function unirestuploader(fileurl, self) {
      return new Promise((resolve, reject) => {
        unirest.post(s3Url)
          .headers({ 'Content-Type': 'multipart/form-data' })
          .field('appid', s3BucketID)
          .field('filename', `${fileurl.name}`)
          .attach('file', fileurl.path.toString())
          .end((response) => {
            const data = response;

            if (data.body.error === true) {
              return Response.failure(res, { message: data.body.message }, httpStatus.BAD_GATEWAY);
            }
            const uri = data.body.response.Location.toString();
            self.logger.info('URI', uri);
            resolve(uri);
          });
      });
    }
  }
}
module.exports = Register;
