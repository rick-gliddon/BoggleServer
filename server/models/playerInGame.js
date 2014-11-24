
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var PlayerInGameSchema = new Schema({
    gameId: String,
    player: { type: String, lowercase: true }
});

module.exports = mongoose.model('PlayerInGame', PlayerInGameSchema);