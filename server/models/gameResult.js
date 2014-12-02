
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var GameResultSchema = new Schema({
    gid: String,
    pls: [String],
    scs: [Number],
    wds: [{
            wrd: String,
            scr: Number,
            pls: [Number]
    }]
});

module.exports = mongoose.model('GameResult', GameResultSchema);