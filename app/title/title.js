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
        var countDownTimer; // Timer for the count down appearing on the start game button
        var countDownStartedBy; // Name of player that created the newly started game
        var countDownTimeRemaining; // Seconds to display on the start game button
        var countDownText; // Start button text not including the count down timer
        var startButtonText; // Entire text to display on the start game button
        var numPlayersWaiting;
        var playersWaiting; // comma and 'and' separated naming of the waiting players
        var playersWaitingLabel; // full label for the players waiting
        
        // Default start button text to something like "Start Competitive Game"
        setStartButtonText();

        gameStateService.addCallback(
                gameStateService.states.TITLE, titleState);

        $http.get('/champboggle2015/api/identify')
                .success(function(playerId) {
                    player = playerId;
                    heartbeatService.setCallback(player, heartbeatCallback);
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
        
        tc.arePlayersWaiting = function() {
            return numPlayersWaiting > 0;
        };
        
        tc.getPlayersWaitingLabel = function() {
            return playersWaitingLabel;
        };
        
        tc.getStartGameLabel = function() {
            return startButtonText;
        };
        
        function titleState(context) {
            console.log('Entered title state');
            if (context && context.player) {
                player = context.player;
                
                heartbeatService.setCallback(player, heartbeatCallback);
            }
        }
        
        // Received callback from heartbeat service.  Update the players waiting and if there is a
        // game newly started, start the count down timer if it isn't already started
        function heartbeatCallback(heartbeatCtx) {
            console.log('heartbeatCallback called');
            numPlayersWaiting = heartbeatCtx.playersWaiting.length;
            if (numPlayersWaiting > 0) {
                var newPlayersWaiting = prettyJoin(heartbeatCtx.playersWaiting);
                if (newPlayersWaiting !== playersWaiting) {
                    console.log('Updating players waiting');
                    playersWaiting = newPlayersWaiting;
                    setPlayersWaitingLabel(numPlayersWaiting, playersWaiting);
                }
            }
            if (heartbeatCtx.gameStartedBy) {
                if (!countDownTimer && heartbeatCtx.secondsLeft > 0) {
                    console.log("count down started, seconds left: " + heartbeatCtx.secondsLeft);
                    countDownStartedBy = heartbeatCtx.gameStartedBy;
                    countDownTimeRemaining = heartbeatCtx.secondsLeft;
                    countDownTimer = $interval(updateCountDown, 1000, countDownTimeRemaining);
                    
                    setCountDownText(countDownStartedBy);
                    setStartButtonText(countDownTimeRemaining);
                }
            }
        }
        
        function setPlayersWaitingLabel(numPlayers, playersWaitingText) {
            var builder = [];
            builder.push(playersWaitingText);
            builder.push(numPlayers > 1 ? " are " : " is ");
            builder.push("ready to play");
            playersWaitingLabel = builder.join('');
        }
        
        // Sets the start button count down text with the name of the play who started the game.
        function setCountDownText(player) {
            var builder = [];
            builder.push('Join ');
            builder.push(capitalise(player));
            builder.push("'s game!");
            countDownText = builder.join('');
        }
        
        // If timeRemaining is greater than zero, updates the start game button text with time remaining to join game.
        // If timeRemaining is falsey, the default start competitive game label is shown.
        function setStartButtonText(timeRemaining) {
            console.log('setStartButtonText called with timeRemaining: ' + timeRemaining);
            if (!timeRemaining) {
                startButtonText = 'Start Competitive Game';
            } else {
                var builder = [];
                builder.push(countDownText);
                builder.push(timeRemaining);
                startButtonText = builder.join(' ');
            }
        }
        
        // Decrements the count down and updates the start button text
        function updateCountDown() {
            countDownTimeRemaining--;
            setStartButtonText(countDownTimeRemaining);
            if (countDownTimeRemaining === 0) {
                countDownTimer = null;
            }
        }
        
        function killTimersAndServices() {
            if (countDownTimer) {
                $interval.cancel(countDownTimer);
                countDownTimer = null;
            }
            heartbeatService.removeCallback();
            setStartButtonText();
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