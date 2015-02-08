// app/models/bear.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = new Schema({
    gameId: String,
    letters: { type: String, lowercase: true },
    startTime: Date,
    startedBy : { type: String, lowercase: true }
});

module.exports = mongoose.model('Game', GameSchema);