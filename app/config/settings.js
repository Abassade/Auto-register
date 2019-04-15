const appName = 'Register-api';

const config = {
  appName,
  port: process.env.PORT || 3000,
  outputDir: `${__dirname.replace('app/config', 'logs')}/`,
  s3UploadUrl: process.env.s3Url,
  s3BucketId: process.env.s3ID,
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT,
  redisDB: process.env.REDIS_DB,
  mongo: {
    collection: process.env.MONGO_COLLECTION,
  },
};
module.exports = config;
