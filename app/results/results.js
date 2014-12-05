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
        rc.matrix = [];
        rc.myWords = [];
        rc.missedWords = [];
        rc.playerScores = [];
        rc.singlePlayer = true;
        rc.youWon = false;
        
        gameResults.addCallback(updateResults);
        
        function updateResults(matrix, foundWords, finalResults) {
            rc.matrix = matrix;
            
            finalResults.pls.forEach(function(playerName, index) {
                var playerScore = {
                    player : playerName,
                    score : finalResults.scs[index]
                };
                rc.playerScores.push(playerScore);
            });
            rc.playerScores.sort(function(a, b) {
                return b.score - a.score;
            });
            rc.singlePlayer = rc.playerScores.length === 1;
            rc.youWon = $scope.player === rc.playerScores[0].player;
            
            finalResults.wds.forEach(function(resultWord) {
                var newWord = {};
                newWord.word = resultWord.wrd;
                newWord.score = resultWord.scr;
                newWord.winner = resultWord.pls.length === 1;
                if (resultWord.pls.indexOf($scope.player) >= 0) {
                    rc.myWords.push(newWord);
                    var index = foundWords.indexOf(resultWord.wrd);
                    foundWords.splice(index, 1);
                } else {
                    rc.missedWords.push(newWord);
                }
                newWord.isActuallyAWord = true;
            });
            foundWords.forEach(function(wrongWord) {
                var newWord = {};
                newWord.isActuallyAWord = false;
                newWord.word = wrongWord;
                newWord.score = 0;
                newWord.winner = false;
            });
        }
    }]);
})();