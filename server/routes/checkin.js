var express = require('express');
var router = express.Router();
var Game = require('../models/game');
var PlayerInGame = require('../models/playerInGame');
var Solution = require('../models/solution');
var GameResult = require('../models/gameResult');
var BoggleEngine = require('../engine/boggleengine');
  
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
                            getAllPlayerWordsAndProcess(player, game, res);
                        }
                    });
                } else {
                    getAllPlayerWordsAndProcess(player, game, res);
                }
            } else {
                console.log('Player ' + player + ' missing from game '
                        + game.gameId + ': ' + err);
                res.status(500).send(err);
            }
        });
}

function getResultAndProcess(player, game, res) {
    GameResult.find({'gid':game.gameId})
        .exec(function handleGetResultCallback(err, gameResult) {
            if (err) {
                var errStr = "Error fetching result for gameId "
                                + game.gameId + ": " + err;
                console.log(errStr);
                res.status(500).send(errStr);
            } else if (gameResult) {
                sendResult(player, gameResult, res);
            } else {
                getAllPlayerWordsAndProcess(player, game, res);
            }
    });
}

function getAllPlayerWordsAndProcess(player, game, res) {
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
                    createResultAndProcess(player, players, game, res);
                }
            }
        });
}
    
function createResultAndProcess(player, players, game, res) {
    
    Solution.findOne({'gameId':game.gameId})
        .select('words')
        .exec(function handleFindSolutionResult(err, solution) {
            if (err || !solution) {
                var errStr = 'Error retrieving solution for gameId '
                                + game.gameId + ': ' + err;
                console.log(errStr);
                res.status(500).send(errStr);
                
            } else {
                
                var gameResult = new GameResult();
                var engine = new BoggleEngine();
                var playerOrder = [];
                var playerIds = {};
                var scores = [];
                
                players.forEach(function(player, index) {
                    playerOrder.push(player.player);
                    playerIds[player.player] = index;
                    scores.push(0);
                });

                solution.words.forEach(function(word) {
                    var wordResult = {
                        wrd : word,
                        scr : engine.calculateScore(word),
                        pls : []
                    };
                    players.forEach(function(playerInGame) {
                        if (contains(playerInGame.words, word)) {
                            var pid = playerIds[playerInGame.player];
                            wordResult.pls.push(pid);
                            scores[pid] += wordResult.scr;
                        }
                    });
                    gameResult.wds.push(wordResult);
                });
                
                gameResult.gid = game.gameId;
                gameResult.pls = playerOrder;
                gameResult.scs = scores;
                
                gameResult.save(function(err) {
                    if (err) {
                        var errStr = "Error saving game result for game ID "
                                        + game.gameId + ": " + err;
                        console.log(errStr);
                        res.status(500).send(errStr);
                    } else {
                        sendResult(player, gameResult, res);
                    }
                });
            }
        });
}

function sendResult(player, gameResult, res) {
    console.log('sendResult called');
    console.log('gameResult.gid: ' + gameResult.gid);
    console.log('gameResult.pls: ' + gameResult.pls);
    console.log('gameResult.scs: ' + gameResult.scs);
    gameResult.wds.forEach(function(word, index) {
        console.log('gameResult.wds['+index+'].wrd: ' + word.wrd);
        console.log('gameResult.scr['+index+'].scr: ' + word.scr);
        console.log('gameResult.pls['+index+'].pls: ' + word.pls);
    });
    res.send("Everything's Cool");
}

function contains(list, item) {
    var found = false;
    for (var i = 0; i < list.length; i++) {
        if (item === list[i]) {
            found = true;
            break;
        } else if (list[i] > item) {
            break;
        }
    }
    return found;
}
    
module.exports = router;