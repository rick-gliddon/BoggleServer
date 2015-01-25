var express = require('express');
var router = express.Router();
var Game = require('../models/game');
var Solution = require('../models/solution');
var PlayerInGame = require('../models/playerInGame');
var GameCreator = require('../util/gameCreator');
var GameSolver = require('../util/gameSolver');

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
    
    var game = new GameCreator().createGame();

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
        
        createSolution(game.letters, id);
    });
}

function createPlayerInGame(player, gameId) {
    var playerInGame = new PlayerInGame();
    playerInGame.gameId = gameId;
    playerInGame.player = player;
    playerInGame.words = null;
    playerInGame.save(function(err) {
        if (err) {
            console.log('Error creating player in game: ' + err);
        }
    });
}

function createSolution(letters, gameId) {
    var solution = new GameSolver.createSolution(letters, gameId, wordTree);
    solution.save(function(err) {
        if (err) {
            console.log('Error creating solution: ' + err);
        }
    });
}
    
module.exports = router;