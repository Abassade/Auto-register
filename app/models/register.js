const mongoose = require('mongoose');

const registerSchema = new mongoose.Schema({
    name:String,
    phoneNumber: String,

});

module.exports = mongoose.model('Register', registerSchema);
