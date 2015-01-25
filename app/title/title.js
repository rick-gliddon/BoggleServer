(function() {
    
    angular.module('title', ['signOnModule'])
    .directive('boggleTitle', function() {
                
       return {
           restrict: 'E',
           scope: {},
           templateUrl: 'title/title.html',
           controller: 'BoggleTitleController',
           controllerAs: 'titleCtrl'
       }; 
    })
    .controller('BoggleTitleController',
    ['$scope', '$http', '$window', 'gameStateService', 'signOnBoggle', 
    function($scope, $http, $window, gameStateService, signOnBoggle) {
        var tc = this;
        
        var player;

        gameStateService.addCallback(
                gameStateService.states.TITLE, titleState);

        $http.get('/champboggle2015/api/identify')
                .success(function(playerId) {
                    player = playerId;
                })
                .error(function(data, status) {
                    if (status === 401) {
                        player = 'guest';
                    } else {
                        console.log('Error identifying user, status: '
                                + status + ', msg: ' + data);
                    }
                });

        tc.startGame = function() {
            gameStateService.nextState({player: player});
        };

        tc.guestStartGame = function() {
            gameStateService.nextState({player: 'guest'});
        };

        tc.showSignOnBoggle = function() {
            signOnBoggle.show().then(function(newPlayer) {
                player = newPlayer;
            });
        };

        tc.isLoggedIn = function() {
            return player && player !== 'guest';
        };

        tc.signOut = function() {
            delete $window.sessionStorage.token;
            player = 'guest';
        };

        tc.capitalisePlayer = function() {
            if (!player) {
                return '';
            }
            return player.charAt(0).toUpperCase()
                    + player.substring(1);
        };
        
        function titleState(context) {
            if (context && context.player) {
                player = context.player;
            }
        }
    }]);
})();