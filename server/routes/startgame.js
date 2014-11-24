var express = require('express');
var router = express.Router();
var BoggleEngine = require('../engine/boggleengine');
var Game = require('../models/game');
var Solution = require('../models/solution');
var PlayerInGame = require('../models/playerInGame');

var WAIT_FOR_PLAYERS_MILLISEC = 10000; // 10 seconds to join

var wordTree;

router.setWordTree = function(newWordTree) {
    wordTree = newWordTree;
};

// create a game (accessed at GET http://localhost:8080/champboggle2015/startgame)
// --------------------------------------------------------------------------
router.get('/', function(req, res) {
    console.log('user ' + req.user.name + ' is calling startgame');
    
    Game.findOne(
        {'startTime':{'$gte': new Date(new Date().getTime() - WAIT_FOR_PLAYERS_MILLISEC)}})
            .select('gameId letters')
            .exec(function handleFindGameResult(err, existingGame) {
                if (err) {
                    console.log('Error searching for running game: ' + res);
                    res.status(500).send(err);
                    return;
                }
                if (existingGame) {
                    res.json({
                        letters: existingGame.letters,
                        checkinPoint: existingGame.gameId});
                    
                    createPlayerInGame(req.user.name, existingGame.gameId);
                
                } else {
                    createNewGame(req.user.name, res);
                }
    });
});

function createNewGame(player, res) {
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
            console.log("Error creating new game: " + err);
            res.status(500).send(err);
            return;
        }

        res.json({ 
            letters: roll,
            checkinPoint: id});

        createPlayerInGame(player, id);
        
        createSolution(game.letters, engine, id);
    });
}

function createPlayerInGame(player, gameId) {
    var playerInGame = new PlayerInGame();
    playerInGame.gameId = gameId;
    playerInGame.player = player;
    playerInGame.save(function(err) {
        if (err) {
            console.log('Error creating player in game: ' + err);
        }
    });
}

function createSolution(letters, boggleEngine, gameId) {
    var solution = new Solution(); // Generate the solution
    solution.gameId = gameId;
    solution.words = boggleEngine.solve(letters, wordTree);
    solution.save(function(err) {
        if (err) {
            console.log('Error creating solution: ' + err);
        }
    });
}

function pad(num, numDigits) {
    numDigits = numDigits || 2;
    var s = "00" + num;
    return s.substr(s.length - numDigits);
}
    
module.exports = router;