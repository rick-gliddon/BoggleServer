var Solution = require('../models/solution');
var BoggleEngine = require('../engine/boggleengine');
var GameResult = require('../models/gameResult');

module.exports = function() {
    
    this.createSolution = function(letters, gameId, wordTree) {
        var solution = new Solution(); // Generate the solution
        var boggleEngine = new BoggleEngine();
        solution.gameId = gameId;
        solution.words = boggleEngine.solve(letters, wordTree);
        
        return solution;
    };
    
    this.createGameResult = function(solution, players, game) {
                
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
                }
            });
            // If only one player found the word, add the score to his total
            if (wordResult.pls.length === 1) {
                scores[wordResult.pls[0]] += wordResult.scr;
            }
            gameResult.wds.push(wordResult);
        });

        gameResult.gid = game.gameId;
        gameResult.pls = playerOrder;
        gameResult.scs = scores;
        
        return gameResult;
    };
    
    this.createSendResult = function(gameResult) {
        var sendResult = {
            pls : gameResult.pls,
            scs : gameResult.scs,
            wds : []
        };
        gameResult.wds.forEach(function(grWd) {
            var srWd = {
                wrd : grWd.wrd,
                scr : grWd.scr,
                pls : grWd.pls
            };
            sendResult.wds.push(srWd);
        });
        return sendResult;
    };

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
};