(function() {
    angular.module('results',[])
    .directive('boggleResults', function() {
        return {
            restrict: 'E',
            scope: {
                nextstate: '&',
                player: '='
            },
            templateUrl: 'results/results.html',
            controller: 'BoggleResultsController',
            controllerAs: 'resultsCtrl'
        };
    })
    .controller('BoggleResultsController', ['gameResults', '$scope', function(gameResults, $scope) {
        
        var rc = this;

        rc.OUTCOMES = {
            YOU_WON : "You Won",
            YOU_DREW : "You came equal first",
            PARTICIPATED : "Participated",
            YOU_LOST : "You came last"
        };
        
        rc.matrix = [];
        rc.myWords = [];
        rc.missedWords = [];
        rc.playerScores = [];
        rc.singlePlayer = true;
        rc.outcome = rc.OUTCOMES.PARTICIPATED;
        
        gameResults.addCallback(updateResults);
        
        rc.guessedByOthers = function(word) {
            return word.players.length > 0;
        };
        
        rc.getPlayerList = function(word) {
            return word.players.join(" + ");
        };
        
        function updateResults(matrix, foundWords, finalResults) {
            rc.matrix = matrix;
            console.log("Updating results");
            
            // Create the player scores
            finalResults.pls.forEach(function(playerName, index) {
                var playerScore = {
                    player : playerName,
                    score : finalResults.scs[index]
                };
                rc.playerScores.push(playerScore);
            });
            // Rank the players with a sort
            rc.playerScores.sort(function(a, b) {
                return b.score - a.score;
            });
            // Determine the outcome and single / muliplayer
            rc.singlePlayer = rc.playerScores.length === 1;
            if (!rc.singlePlayer && $scope.player === rc.playerScores[0].player) {
                if (rc.playerScores[0].score > rc.playerScores[1].score) {
                    rc.outcome = rc.OUTCOMES.YOU_WON;
                } else {
                    rc.outcome = rc.OUTCOMES.YOU_DREW;
                }
            } else if (!rc.singlePlayer) {
                rc.outcome = rc.OUTCOMES.PARTICIPATED;
                var firstScore = rc.playerScores[0].score;
                for (var i = 1; i < rc.playerScores.length; i++) {
                    if (rc.playerScores[i].score === firstScore) {
                        if (rc.playerScores[i].player === $scope.player) {
                            rc.outcome = rc.OUTCOMES.YOU_DREW;
                        }
                    } else {
                        break;
                    }
                }
            }
            // Construct the myWords and missedWords lists
            finalResults.wds.forEach(function(resultWord) {
                if (resultWord.wrd.length >= 3) {
                var newWord = {};
                newWord.word = resultWord.wrd;
                newWord.score = resultWord.scr;
                newWord.winner = resultWord.pls.length === 1;
                newWord.isActuallyAWord = true;
                newWord.players = [];
                var myWord = false;
                resultWord.pls.forEach(function(playerId) {
                    var currentPlayer = finalResults.pls[playerId];
                    if (currentPlayer === $scope.player) {
                        myWord = true;
                    } else {
                        newWord.players.push(currentPlayer);
                    }
                });
                if (myWord) {
                    rc.myWords.push(newWord);
                    var index = foundWords.indexOf(resultWord.wrd);
                    // Remove the word from the foundWords list
                    foundWords.splice(index, 1);
                } else {
                    rc.missedWords.push(newWord);
                }
                }
            });
            foundWords.forEach(function(wrongWord) {
                var newWord = {};
                newWord.isActuallyAWord = false;
                newWord.word = wrongWord;
                newWord.score = 0;
                newWord.winner = false;
                newWord.players = [];
                rc.myWords.push(newWord);
            });
        }
    }]);
})();