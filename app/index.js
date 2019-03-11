/* eslint-disable no-undef */
require('dotenv').config();
const restify = require('restify');
const path = require('path');
const multer = require('multer');
const restifyPlugins = require('restify').plugins;
const corsMiddleware = require('restify-cors-middleware');
const servicelocator = require('./config/di');
const config = require('./config/settings');
const registerRoutes = require('./routes/register');

const logger = servicelocator.get('logger');
const requestLogger = servicelocator.get('requestlogger');

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads/'));
  },
  filename(req, file, cb) {
    cb(null, Date.now() + file.fieldname);
  },
});
const upload = multer({ storage });


const cors = corsMiddleware({
  preflightMaxAge: 5,
  origins: ['*'],
});

const server = restify.createServer({
  name: config.appName,
  versions: ['1.0.0'],
});

server.post('/test-upload', upload.single(), (req, res, next) => {
  logger.info('FILES-UPLOADED', req.files);
  res.send(req.files);
  next();
});


/**
 * Middleware
 */

server.use(restifyPlugins.bodyParser());
server.use(restifyPlugins.acceptParser(server.acceptable));
server.use(restifyPlugins.queryParser());
server.pre(cors.preflight);
server.use(cors.actual);

// setup requests logging
server.use(requestLogger);

// setup Routing for auto
registerRoutes.setup(server, servicelocator);

server.listen(config.port, () => {
  logger.info(`${server.name} is listening on ${server.url}`);
});

module.exports = server;
