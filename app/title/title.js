(function() {
    
    angular.module('title', [])
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
    ['$scope', '$http', '$window', 'gameStateService', 
    function($scope, $http, $window, gameStateService) {
        var tc = this;
        
        var player;
        
        // Add callback to heartbeatService
        // When callback called update players waiting
        // and if gameStartedBy
        // if countingDownTimer null
        // set start text and initial timer val of floor of secondsLeft,
        // start countdown using floor of secondsLeft
        
        // countDownTimer triggered
        // if last countdown, set start text to regular
        // else update with timer val
        
        // On exit cancel hearbeatService and countDown timer.

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
            gameStateService.login();
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
        
        tc.isPlayersWaiting = function() {
            return true;
        };
        
        tc.getPlayersWaiting = function() {
            return "Tom, Dick and Harry";
        };
        
        tc.getStartGameLabel = function() {
            return 'Start Deathmatch';
        };
        
        function titleState(context) {
            if (context && context.player) {
                player = context.player;
            }
        }
    }]);
})();