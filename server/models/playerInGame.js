
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerInGameSchema = new Schema({
    gameId: String,
    player: { type: String, lowercase: true },
    words: [String]
});

module.exports = mongoose.model('PlayerInGame', PlayerInGameSchema);