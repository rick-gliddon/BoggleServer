(function() {
    angular.module('results',[])
    .directive('boggleResults', function() {
        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'results/results.html',
            controller: 'BoggleResultsController',
            controllerAs: 'resultsCtrl'
        };
    })
    .controller('BoggleResultsController',
    ['gameStateService', '$scope', 'wordFinder', 'heartbeatService', 
    function(gameStateService, $scope, wordFinder, heartbeatService) {
        
        var rc = this;
        var player;
        var highlightedDice = [];
        var selectedWord;
        var startGameLabel;
        var statusDescription;

        rc.OUTCOMES = {
            YOU_WON : "You Won",
            YOU_DREW : "You came equal first",
            PARTICIPATED : "Participated",
            YOU_LOST : "You came last"
        };
        
        rc.matrix;
        rc.myWords;
        rc.missedWords;
        rc.playerScores;
        rc.singlePlayer;
        rc.outcome;
        rc.totalScore;
        
        function initialise() {
            rc.matrix = [];
            rc.myWords = [];
            rc.missedWords = [];
            rc.playerScores = [];
            rc.singlePlayer = true;
            rc.outcome = rc.OUTCOMES.PARTICIPATED;
        }
        
        gameStateService.addCallback(
                gameStateService.states.RESULTS, updateResults);
        
        rc.guessedByOthers = function(word) {
            return word.players.length > 0;
        };
        
        rc.getPlayerList = function(word) {
            return word.players.join(" + ");
        };
        
        rc.isGuest = function() {
            return player === 'guest';
        };
        
        rc.getStartGameLabel = function() {
            return startGameLabel;
        };
        
        rc.getStatusDescription = function() {
            return statusDescription;
        };
        
        rc.login = function() {
            gameStateService.login();
        };
        
        rc.startGame = function() {
            heartbeatService.removeCallback();
            gameStateService.jumpStart({player: player});
        };
        
        rc.mainMenu = function() {
            heartbeatService.removeCallback();
            gameStateService.quit({player: player});
        };
        
        function updateResults(context) {
            initialise();
            var foundWords = context.wordList;
            var finalResults = context.finalResults;
            rc.matrix = context.matrix;
            player = context.player.toLowerCase();
            
            if (player === 'guest') {
                statusDescription = 'Why not log in and play with others?';
                startGameLabel = "Start Solo Game";
            } else {
                heartbeatService.setCallback(heartbeatCallback);
                startGameLabel = "Start Game";
            }
            
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
            if (!rc.singlePlayer && player === rc.playerScores[0].player) {
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
                        if (rc.playerScores[i].player === player) {
                            rc.outcome = rc.OUTCOMES.YOU_DREW;
                        }
                    } else {
                        break;
                    }
                }
            }
            // Construct the myWords and missedWords lists
            rc.totalScore = 0;
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
                        if (currentPlayer === player) {
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
                    if (resultWord.scr) {
                        rc.totalScore += resultWord.scr;
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
        
        rc.isSelectedWord = function(word) {
            return word === selectedWord;
        };
        
        rc.highlightDice = function(word) {
            if (rc.isSelectedWord(word)) {
                return;
            }
            highlightedDice.forEach(function(die) {
                die.selected = false;
            });
            highlightedDice = [];
            
            if (!word.isActuallyAWord) {
                selectedWord = null;
                return;
            }
            selectedWord = word;
            var searchWord = word.word.slice().replace("qu", "q");
            var diceActions = wordFinder.addLetterList([], searchWord);
            diceActions.pop(); // remove the success element
            diceActions.forEach(function(dieAction) {
                dieAction.die.selected = true;
                highlightedDice.push(dieAction.die);
            });
        };
        
        // Received callback from heartbeat service.
        function heartbeatCallback(heartbeatCtx) {
            console.log('heartbeatCallback called');
            if (heartbeatCtx.description !== statusDescription) {
                statusDescription = heartbeatCtx.description;
            }
            if (heartbeatCtx.startGameLabel !== startGameLabel) {
                startGameLabel = heartbeatCtx.startGameLabel;
            }
        }
    }]);
})();