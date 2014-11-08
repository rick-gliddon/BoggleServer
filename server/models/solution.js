// app/models/bear.js

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameSchema = new Schema({
//    id: Schema.ObjectId,
    letters: { type: String, lowercase: true },
    startTime: Date,
    checkinPoint: String
});

module.exports = mongoose.model('Game', GameSchema);