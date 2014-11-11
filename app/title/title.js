(function() {
    var titleApp = angular.module('title', []);
    
    titleApp.directive('gameTitle', function() {
       return {
           restrict: 'E',
           scope: {
               nextstate: '&'
           },
           templateUrl: 'title/game-title.html',
           controller: function($scope) {
               var tc = this;
    
               tc.startGame = function() {
                   $scope.nextstate();
               };
           },
           controllerAs: 'titleCtrl'
       } 
    });
})();