var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerSchema = new Schema({
    username: { type: String, lowercase: true },
    password: String,
    heartbeat: Date
});

module.exports = mongoose.model('Player', PlayerSchema);