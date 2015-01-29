var express = require('express');
var router = express.Router();
var Game = require('../models/game');
var PlayerInGame = require('../models/playerInGame');
var Solution = require('../models/solution');
var GameResult = require('../models/gameResult');
var GameSolver = require('../util/gameSolver');
  
// check-in a word list
// --------------------
router.post('/:game_id', function(req, res) {
    var gameId = req.params.game_id;
    var player = req.user.name;
    var playerWords = req.body.words;
    
    // Find the game with the given game ID
    Game.findOne({'gameId':gameId})
        .select('gameId letters startTime')
        .exec(function handleFindGameResult(err, game) {
            if (err) {
                console.log('Error retrieving game: ' + err);
                res.status(500).send(err);
                return;
            }
            if (game) {
                persistPlayerWordsAndProcess(player, playerWords, game, res);
            
            } else {
                console.log('Error retrieving game: ' + err);
                res.status(500).send(err);
            }
        });
});

function persistPlayerWordsAndProcess(player, playerWords, game, res) {
    // First check whether player words have already been persisted
    PlayerInGame.findOne({'gameId':game.gameId, 'player':player})
        .select('words')
        .exec(function handleFindPlayerInGameResult(err, playerInGame) {
            if (err) {
                console.log('Error retrieving game: ' + err);
                res.status(500).send(err);
                return;
            }
            
            if (playerInGame) {
                if (playerInGame.words === null) {
                    var conditions = {
                        'gameId' : game.gameId,
                        'player' : player};
                    var update = {$set : {'words' : playerWords.sort()}};
                    PlayerInGame.update(conditions, update, function(err) {
                        if (err) {
                            console.log('Error updating player words: ' + err);
                            res.status(500).send(err);
                        } else {
                            getAllPlayerWordsAndProcess(game, res);
                        }
                    });
                } else {
                    getAllPlayerWordsAndProcess(game, res);
                }
            } else {
                console.log('Player ' + player + ' missing from game '
                        + game.gameId + ': ' + err);
                res.status(500).send(err);
            }
        });
}

function getAllPlayerWordsAndProcess(game, res) {
    PlayerInGame.find({'gameId':game.gameId})
//        .select('player words')
        .exec(function handleGetAllPlayersInGameResult(err, players) {
            if (err) {
                console.log("Could not find players in game " 
                            + game.gameId + ": " + err);
                res.status(500).send(err);
            } else {
                var foundNull = false;
                for (var i = 0; i < players.length; i++) {
                    if (players[i].words === null) {
                        foundNull = true;
                        break;
                    }
                }
                if (foundNull) {
                    res.status(202).send();
                    console.log('Found player with null words');
                } else {
                    createResultAndProcess(players, game, res);
                }
            }
        });
}
    
function createResultAndProcess(players, game, res) {
    
    Solution.findOne({'gameId':game.gameId})
        .select('words')
        .exec(function handleFindSolutionResult(err, solution) {
            if (err || !solution) {
                var errStr = 'Error retrieving solution for gameId '
                                + game.gameId + ': ' + err;
                console.log(errStr);
                res.status(500).send(errStr);
                
            } else {
                
                var gameResult = new GameSolver().createGameResult(
                        solution, players, game);
                
                gameResult.save(function(err) {
                    if (err) {
                        var errStr = "Error saving game result for game ID "
                                        + game.gameId + ": " + err;
                        console.log(errStr);
                        res.status(500).send(errStr);
                    } else {
                        sendResult(gameResult, res);
                    }
                });
            }
        });
}

function sendResult(gameResult, res) {
    var sendResult = new GameSolver().createSendResult(gameResult);
    res.json(sendResult);
}
    
module.exports = router;