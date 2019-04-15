const mongoose = require('mongoose');
const settings = require('../config/settings');

const mongoCollection = settings.mongo.collection;

const registerSchema = new mongoose.Schema({
  name: String,
  phoneNumber: String,

});

module.exports = mongoose.model(mongoCollection, registerSchema);
