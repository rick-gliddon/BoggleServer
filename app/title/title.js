(function() {
    
    angular.module('title', [])
           .directive('boggleTitle', function() {
                
       return {
           restrict: 'E',
           scope: {
               nextstate: '&'
           },
           templateUrl: 'title/title.html',
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