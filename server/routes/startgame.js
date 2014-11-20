var express = require('express');
var router = express.Router();
var BoggleEngine = require('../engine/boggleengine');
var Game = require('../models/game');
var Solution = require('../models/solution');

var wordTree;

router.setWordTree = function(newWordTree) {
    wordTree = newWordTree;
};

// create a game (accessed at GET http://localhost:8080/champboggle2015/startgame)
// --------------------------------------------------------------------------
router.get('/', function(req, res) {

    // Create the Boggle Engine!!!
    var engine = new BoggleEngine();

    var startTime = new Date();
    var dd = pad(startTime.getDate());
    var MM = pad(startTime.getMonth() + 1);
    var yy = pad(startTime.getFullYear());
    var hh = pad(startTime.getHours());
    var mm = pad(startTime.getMinutes());
    var ss = pad(startTime.getSeconds());
    var mls = pad(startTime.getMilliseconds(), 3);

    var roll = engine.rollDice();
    var id = roll + yy + MM + dd + hh + mm + ss + mls;

    var game = new Game(); // create a new instance of the Game model
    game.gameId = id; 
    game.letters = roll;
    game.startTime = startTime;

    // save the game and send the response
    game.save(function(err) {

        if (err) {
            res.send(err);
        }

        res.json({ 
            letters: roll,
            checkinPoint: id});
    });

    var solution = new Solution(); // Generate the solution
    solution.gameId = id;
    solution.words = engine.solve(game.letters, wordTree);

    // save the solution
    solution.save(function(err) {
        if (err) {
            console.log(err);
        }
    });
});

function pad(num, numDigits) {
    numDigits = numDigits || 2;
    var s = "00" + num;
    return s.substr(s.length - numDigits);
}
    
module.exports = router;