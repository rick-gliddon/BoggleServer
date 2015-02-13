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
            .select('gameId letters startedBy')
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
                    
                    if (existingGame.startedBy !== req.user.name) {
                        checkIfPlayerInGame(req.user.name, existingGame.gameId);
                    } else {
                        console.log("Found game starter YO!!!!!!!");
                    }
                
                } else {
                    createNewGame(req.user.name, res);
                }
    });
});

function checkIfPlayerInGame(player, gameId) {
    PlayerInGame.findOne(
        {'player':player,
         'gameId':gameId})
            .select('player')
            .exec(function handleFindGameResult(err, existingPlayer) {
                if (!existingPlayer) {
                    console.log("No existing player YO!!!!!!!!!!!!");
                    createPlayerInGame(player, gameId);
                } else {
                    console.log("Found existing player YO!!!!!!!!!!");
                }
         });
};

function createNewGame(player, res) {
    
    var game = new GameCreator().createGame();
    game.startedBy = player;

    // save the game and send the response
    game.save(function(err) {

        if (err) {
            console.log("Error creating new game: " + err);
            res.status(500).send(err);
            return;
        }

        res.json({ 
            letters: game.letters,
            checkinPoint: game.gameId});

        createPlayerInGame(player, game.gameId);
        
        createSolution(game.letters, game.gameId);
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
    var solution = new GameSolver().createSolution(letters, gameId, wordTree);
    solution.save(function(err) {
        if (err) {
            console.log('Error creating solution: ' + err);
        }
    });
}
    
module.exports = router;