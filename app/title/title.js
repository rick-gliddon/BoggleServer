(function() {
    
    angular.module('title', ['signOnModule'])
    .directive('boggleTitle', function() {
                
       return {
           restrict: 'E',
           scope: {
               nextstate: '&',
               player: '='
           },
           templateUrl: 'title/title.html',
           controller: 'BoggleTitleController',
           controllerAs: 'titleCtrl'
       } 
    })
    .controller('BoggleTitleController', ['$scope', '$http', '$window', 'signOnBoggle', 
        function($scope, $http, $window, signOnBoggle) {
            var tc = this;
            
            $http.get('/champboggle2015/api/identify')
                    .success(function(data) {
                        $scope.player = data;
                    })
                    .error(function(data, status) {
                        if (status === 401) {
                            $scope.player = 'guest';
                        } else {
                            console.log('Error identifying user, status: '
                                    + status + ', msg: ' + data);
                        }
                    });
    
            tc.startGame = function() {
                $scope.nextstate();
            };

            tc.showSignOnBoggle = function() {
                signOnBoggle.show().then(function(newPlayer) {
                    $scope.player = newPlayer;
                });
            };

            tc.isLoggedIn = function() {
                return $scope.player && $scope.player !== 'guest';
            }
            
            tc.signOut = function() {
                delete $window.sessionStorage.token;
                $scope.player = 'guest';
            }
            
            tc.capitalisePlayer = function() {
                if (!$scope.player) {
                    return '';
                }
                return $scope.player.charAt(0).toUpperCase()
                        + $scope.player.substring(1);
            }
        }]);
})();