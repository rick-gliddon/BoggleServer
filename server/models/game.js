// app/models/bear.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = new Schema({
    id: {type: String, index: true },
    letters: { type: String, lowercase: true },
    startTime: Date
});

module.exports = mongoose.model('Game', GameSchema);