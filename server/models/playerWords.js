
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerWordsSchema = new Schema({
    gameId: String,
    words: [String]
});

module.exports = mongoose.model('PlayerWords', PlayerWordsSchema);