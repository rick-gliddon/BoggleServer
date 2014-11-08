
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var SolutionSchema = new Schema({
    gameId: {type: String, index: true },
    words: [String]
});

module.exports = mongoose.model('Solution', SolutionSchema);