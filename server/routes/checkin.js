var express = require('express');
var router = express.Router();
var Game = require('../models/game');
var PlayerWords = require('../models/playerWords');
var Solution = require('../models/solution');
  
// check-in a word list
// --------------------
router.post('/:game_id', function(req, res) {
    var gameId = req.params.game_id;
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
            persistPlayerWordsAndProcess(playerWords, game, res);
        });
});

function persistPlayerWordsAndProcess(playerWords, game, res) {
    // First check whether player words have already been persisted
    PlayerWords.findOne({'gameId':game.gameId})
        .exec(function handleFindPlayerWordsResult(err, result) {
            if (err) {
                console.log('Error retrieving game: ' + err);
                res.status(500).send(err);
                return;
            }
            
            if (!result) {
                var playerWordsModel = new PlayerWords();
                playerWordsModel.gameId = game.gameId;
                playerWordsModel.words = playerWords;
                playerWordsModel.save(function(err) {
                    if (err) {
                        res.send(err);
                    }
                });
                
                // TODO: Multiplayer, need to check all players have
                // posted their words.
                createAndSendResult(playerWordsModel, res);
            }
    });
}
    
function createAndSendResult(playerWords, res) {
    
    Solution.findOne({'gameId':playerWords.gameId})
        .select('words')
        .exec(function handleFindSolutionResult(err, solution) {
            if (err) {
               console.log('Error retrieving solution: ' + err);
                res.status(500).send(err);
                return;
            }
            
            var correctWords = playerWords.words
                .filter(function(word) {
                    return solution.words.indexOf(word) >= 0;
                });
            var wrongWords = playerWords.words
                .filter(function(word) {
                    return solution.words.indexOf(word) < 0;
                });
                
            
            // TODO
            // Map the correct words onto the solution words
            // Need to find my scratchings in my bag
            console.log('Complete words: ' + solution.words);
            console.log('Entered words: ' + playerWords.words);
            console.log('Wrong words: ' + wrongWords);
            console.log('Correct words: ' + correctWords);
        });
}
    
module.exports = router;