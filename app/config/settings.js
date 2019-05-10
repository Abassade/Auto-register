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
    connection: {
      host: process.env.MONGODB_HOST,
      username: process.env.MONGODB_USER,
      password: process.env.MONGODB_PASSWORD,
      port: process.env.MONGODB_PORT,
      dbProd: process.env.MONGODB_DATABASE_NAME,
    },
    collections: {
      rawData: process.env.MONGO_COLLECTION,
    },
    queryLimit: process.env.MONGODB_QUERY_LIMIT,
    questionLimit: process.env.QUESTION_LIMIT,
  },
};
module.exports = config;
