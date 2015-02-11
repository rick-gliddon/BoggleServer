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
    ['$scope', '$http', '$window', 'gameStateService', 'heartbeatService', '$interval',
    function($scope, $http, $window, gameStateService, heartbeatService, $interval) {
        var tc = this;
        
        var player; // The current player name
        var startButtonText; // Entire text to display on the start game button
        var serverStatusLabel; // full label for the players waiting
        
        gameStateService.addCallback(
                gameStateService.states.TITLE, titleState);

        $http.get('/champboggle2015/api/identify')
                .success(function(playerId) {
                    player = playerId;
                    heartbeatService.setCallback(heartbeatCallback);
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
            killTimersAndServices();
        };

        tc.guestStartGame = function() {
            gameStateService.nextState({player: 'guest'});
        };

        tc.showSignOnBoggle = function() {
            gameStateService.login();
            killTimersAndServices();
        };

        tc.isLoggedIn = function() {
            return player && player !== 'guest';
        };

        tc.signOut = function() {
            delete $window.sessionStorage.token;
            player = 'guest';
            killTimersAndServices();
        };

        tc.capitalisePlayer = function() {
            return capitalise(player);
        };
        
        tc.getServerStatusLabel = function() {
            return serverStatusLabel;
        };
        
        tc.getStartGameLabel = function() {
            return startButtonText;
        };
        
        function titleState(context) {
            console.log('Entered title state');
            if (context && context.player) {
                player = context.player;
                
                initialiseLabels();
                heartbeatService.setCallback(heartbeatCallback);
            }
        }
        
        function initialiseLabels() {
            serverStatusLabel = "";
            startButtonText = "Start Game";
        }
        
        // Received callback from heartbeat service.  Update the players waiting and if there is a
        // game newly started, start the count down timer if it isn't already started
        function heartbeatCallback(heartbeatCtx) {
            console.log('heartbeatCallback called');
            if (heartbeatCtx.description !== serverStatusLabel) {
                serverStatusLabel = heartbeatCtx.description;
            }
            if (heartbeatCtx.startGameLabel !== startButtonText) {
                startButtonText = heartbeatCtx.startGameLabel;
            }
        }
        
        function killTimersAndServices() {
            heartbeatService.removeCallback();
            initialiseLabels();
        }
        
        function capitalise(text) {
            if (!text) {
                return '';
            }
            return text.charAt(0).toUpperCase()
                    + text.substring(1);
        }
        
        function prettyJoin(array) {
            var builder = [];
            for (var i = 0; i < array.length; i++) {
                builder.push(capitalise(array[i]));
                if (i < array.length - 2) {
                    builder.push(', ');
                } else if (i === array.length - 2) {
                    builder.push(' & ');
                }
            }
            return builder.join('');
        }
    }]);
})();