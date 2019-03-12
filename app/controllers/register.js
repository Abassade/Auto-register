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


  saveDetail(req, res) {
    this.logger.info('request', req.body);
    const { msisdn } = req.body;
    const allPassedData = req.body;
    if (!msisdn || !req.files.IDcard || !req.files.passportPhoto) {
      return Response.failure(res, {
        error: true,
        message: 'Please msisdn and IDcard,passportPhoto must be passed!!',
      }, httpStatus.BadRequest);
    }

    if (msisdn.toString().trim() === '') {
      this.logger.info('msisdn must not be empty');
      return Response.failure(res, {
        error: true,
        message: 'msisdn must not be empty',
      }, httpStatus.BadRequest);
    }

    const checkIfExists = msisdn;

    this.registerService.checkRedis(checkIfExists)
      .then((reply) => {
        if (reply === 1) {
          this.logger.info('A user with this msisdn already exists');
          return Response.success(res, {
            message: 'A user with this msisdn already exists',
            response: [],
          }, httpStatus.OK);
        }
        if (reply === 0) {
          allPassedData.msisdn = msisdn;
          this.registerService.saveToRedis(msisdn, msisdn)
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
                        this.logger.info('All saved data', allPassedData);
                        return Response.success(res, {
                          message: 'Data successfully saved',
                          response: message,
                        }, httpStatus.OK);
                      });
                  }).catch((err) => {
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
