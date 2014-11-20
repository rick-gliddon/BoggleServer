(function() {
    
    angular.module('title', [])
           .directive('boggleTitle', function() {
                
       return {
           restrict: 'E',
           scope: {
               nextstate: '&'
           },
           templateUrl: 'title/title.html',
           controller: function($scope, $http, $window) {
                var tc = this;
    
                tc.startGame = function() {
                    $scope.nextstate();
                };
               
                $scope.user = {username: 'john.doe', password: 'foobar'};
                $scope.message = '';
                $scope.submit = function () {
                    $http
                      .post('/champboggle2015/authenticate', $scope.user)
                        .success(function (data, status, headers, config) {
                        $window.sessionStorage.token = data.token;
                        $scope.message = 'Welcome';
                      })
                      .error(function (data, status, headers, config) {
                        // Erase the token if the user fails to log in
                        delete $window.sessionStorage.token;

                        // Handle login errors here
                        $scope.message = 'Error: Invalid user or password';
                      });
                };
           },
           controllerAs: 'titleCtrl'
       } 
    });
})();