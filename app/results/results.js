(function() {
    angular.module('results',[])
    .directive('boggleResults', function() {
        return {
            restrict: 'E',
            scope: {
                nextstate: '&'
            },
            templateUrl: 'results/results.html',
            controller: 'BoggleResultsController',
            controllerAs: 'resultsCtrl'
        };
    })
    .controller('BoggleResultsController', ['gameResults', '$scope', function(gameResults, $scope) {
        var rc = this;
        $scope.$watch(gameResults.getFoundWords(), function() {
            rc.foundWords = gameResults.getFoundWords();
            rc.finalResults = gameResults.getFinalResults();
        });
    }]);
})();