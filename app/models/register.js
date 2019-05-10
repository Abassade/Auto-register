const mongoose = require('mongoose');
const settings = require('../config/settings');

const mongoCollection = settings.mongo.collections.rawData;

const registerSchema = new mongoose.Schema({
  msisdn: {
    type: String,
    required: true,
  },
  cardType: {
    type: String,
  },
  IDcard: {
    type: String,
  },
  passportPhoto: {
    type: String,
  },

},
{
  timestamps: true,
});

module.exports = mongoose.model(mongoCollection, registerSchema);
