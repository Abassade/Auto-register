const config = require('../config/settings');

const routes = function routes(server, serviceLocator) {
  const RegisterController = serviceLocator.get('RegisterController');

  server.get({
    path: '/',
    name: 'home',
    version: '1.0.0',
  }, (req, res) => res.send(`Welcome to ${config.appName} API`));

  server.get({
    path: '/form',
    name: 'Get the auto-filled form .txt format',
    version: '1.0.0',
  }, (req, res) => RegisterController.getProcessedForm(req, res));

  server.get({
    path: '/data',
    name: 'Get all raw data',
    version: '1.0.0',
  }, (req, res) => RegisterController.getAllRawData(req, res));

  server.post({
    path: '/register',
    name: 'Post msisdn, ID card, passport',
    version: '1.0.0',
  }, (req, res) => RegisterController.saveDetail(req, res));
};

module.exports.setup = routes;
