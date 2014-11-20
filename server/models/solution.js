
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SolutionSchema = new Schema({
    gameId: String,
    words: [String]
});

module.exports = mongoose.model('Solution', SolutionSchema);