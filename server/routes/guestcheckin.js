var express = require('express');
var router = express.Router();
var GameSolver = require('../util/gameSolver');

var wordTree;

router.setWordTree = function(newWordTree) {
    wordTree = newWordTree;
};
  
// check-in a word list
// --------------------
router.post('/:game_id', function(req, res) {
    console.log('Guest checkin called.  gameId: ' + req.params.game_id);
    var gameId = req.params.game_id;
    var letters = gameId.substr(0, 16);
    var playerInGame = {
        gameId: gameId,
        player: 'guest',
        words: req.body.words.sort()
    };
    var game = {
        gameId: gameId,
        letters: letters,
        startTime: new Date()
    };
    var gameSolver = new GameSolver();
    
    var solution = gameSolver.createSolution(letters, gameId, wordTree);
    var result = gameSolver.createGameResult(
            solution, [playerInGame], game);
    var sendResult = gameSolver.createSendResult(result);
    
    res.json(sendResult);
});
    
module.exports = router;