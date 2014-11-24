var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
    username: { type: String, lowercase: true },
    password: String
});

module.exports = mongoose.model('Player', PlayerSchema);