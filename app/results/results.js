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
        rc.foundWords = [];
        rc.finalResults = {};
        rc.playerScores = [];
        rc.singlePlayer = true;
        rc.youWon = false;
        
        gameResults.addCallback(updateResults);
        
        function updateResults(matrix, playerWords, finalResults) {
            rc.matrix = matrix;
            rc.foundWords = playerWords;
            rc.finalResults = finalResults;
            
            finalResults.pls.forEach(function(playerName, index) {
                var playerScore = {
                    player : playerName,
                    score : finalResults.scs[index]
                };
                rc.playerScores.push(playerScore);
            });
            rc.playerScores.sort(function(a, b) {
                return b - a;
            });
            rc.singlePlayer = rc.playerScores.length === 1;
            rc.youWon = $scope.player === rc.playerScores[0].player;
        }
    }]);
})();