(function() {

  var app = angular.module('bogglesim',['title', 'play', 'results', 'login']);

  app.factory('authInterceptor', function ($rootScope, $q, $window) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        if ($window.sessionStorage.token) {
          config.headers.Authorization = 'Bearer ' + $window.sessionStorage.token;
        }
        return config;
      },
      response: function (response) {
        if (response.status === 401) {
          // handle the case where the user is not authenticated
        }
        return response || $q.when(response);
      }
    };
  });

  app.factory('gameStateService', function() {
      var callbackList = [];
      var states = {
          TITLE : 0,
          REQUEST_PLAY : 1,
          PLAY : 2,
          RESULTS : 3,
          LOGIN : 99
      };
      var numStates = 4; // Not including login (!)
      var currentState = states.TITLE;

      function addCallback(state, newCallback) {
          var callbackObj = {state: state, callback: newCallback};
          callbackList.push(callbackObj);
      }

      function nextState(context) {
          advanceState();
          notify(context);
      }
      
      function login(context) {
          currentState = states.LOGIN;
          notify(context);
      }

      function jumpStart(context) {
          currentState = states.REQUEST_PLAY;
          notify(context);
      }
      
      function quit(context) {
          currentState = states.TITLE;
          notify(context);
      }

      function indexOf(array, item) {
          var index = -1;
          for (var i = 0; i < array.length; i++) {
              if (angular.equals(array[i], item)) {
                  index = i;
                  break;
              }
          }
          return index;
      }

      function advanceState() {
          currentState = (currentState + 1) % numStates;
      }

      function notify(context) {
          callbackList.forEach(function(callbackObj) {
              if (callbackObj.state === currentState) {
                  callbackObj.callback(context);
              }
          });
      }

      return {
          states : states,
          addCallback : addCallback,
          nextState : nextState,
          login : login,
          jumpStart : jumpStart,
          quit : quit
      };
  });
  
  app.factory('heartbeatService',
  ['$interval', '$http', '$window',
  function($interval, $http, $window) {
      var callback = null;
      var heartbeatTimer;

      var ALLS_QUIET_LABELS = [
        "All's quiet at the Boggle Server",
        "So, it looks like you're the only one logged in",
        "There's no one to play with right now",
        "Looks like you're on your lonesome",
        "There are tumble weeds blowing through the Boggle Server"
      ];

      var PLAYERS_WAITING_LABELS = [
        "ready to play",
        "waiting to get Boggly",
        "hanging around doing nothing"
      ];
      
      var START_GAME_LABEL = "Start Game";

      var STATES = {
        GAME_STARTED: 0,
        PLAYERS_WAITING: 1,
        GAME_IN_PROGRESS: 2,
        ALLS_QUIET: 3,
        STOPPED: 4 // will not be sent
      };

      var allsQuietLabel;
      var playersWaitingLabel;
      var startGameLabel;
      var countDown;
      var gameStartedBy;
      
      function initialiseLabels() {
          allsQuietLabel = pickLabel(ALLS_QUIET_LABELS);
          playersWaitingLabel = pickLabel(PLAYERS_WAITING_LABELS);
          startGameLabel = START_GAME_LABEL;
      }

      function pickLabel(labels) {
          return labels[Math.floor(Math.random() * labels.length)];
      }
      
      function setCallback(newCallback) {
          callback = newCallback;
          initialiseLabels();
          postHeartbeat();
      }
      
      function removeCallback() {
          callback = null;
          player = null;
          $interval.cancel(heartbeatTimer);
      }
      
      function postHeartbeat() {
          $http.put('/champboggle2015/api/heartbeat', {})
                  .error(function(err, status) {
                      if (status !== 401) { // Will get 401 if heart beat is sent after log out
                          $window.alert('Error sending heartbeat to server: ' + err);
                          $interval.cancel(heartbeatTimer);
                      }
                  })
                  .success(function(result) {
                      
                      switch(result.state) {
                          
                          case STATES.GAME_STARTED:
                              countDown = result.ctx.secondsLeft;
                              gameStartedBy = capitalise(result.ctx.startedBy);
                              var builder = [];
                              builder.push("Join ");
                              builder.push(gameStartedBy);
                              builder.push("'s game: ");
                              builder.push(countDown);
                              var response = {
                                  description: gameStartedBy + " has started a game!",
                                  startGameLabel: builder.join('')
                              };
                              callback(response);
                              heartbeatTimer = $interval(updateCountDown, 1000, countDown);
                              break;
                              
                          case STATES.PLAYERS_WAITING:
                              var joiner = result.ctx.players.length > 1 ? "are" : "is";
                              var builder = [];
                              builder.push(prettyJoin(result.ctx.players));
                              builder.push(joiner);
                              builder.push(playersWaitingLabel);
                              var response = {
                                  description: builder.join(' '),
                                  startGameLabel: startGameLabel
                              };
                              callback(response);
                              heartbeatTimer = $interval(postHeartbeat, 1000, 1);
                              break;
                              
                          case STATES.GAME_IN_PROGRESS:
                              var plural = result.ctx.numGames > 1 ? "s" : "";
                              var builder = [];
                              builder.push(result.ctx.numGames);
                              builder.push(" game");
                              builder.push(plural);
                              builder.push(" in progress, starring ");
                              builder.push(prettyJoin(result.ctx.featuring));
                              builder.push("; ");
                              builder.push(result.ctx.secondsLeft);
                              builder.push(" seconds till it's done.");
                              var response = {
                                  description: builder.join(''),
                                  startGameLabel: startGameLabel
                              };
                              callback(response);
                              heartbeatTimer = $interval(postHeartbeat, 5000, 1);
                              break;
                              
                          case STATES.ALLS_QUIET:
                              var response = {
                                  description: allsQuietLabel,
                                  startGameLabel: startGameLabel
                              };
                              callback(response);
                              heartbeatTimer = $interval(postHeartbeat, 5000, 1);
                              break;
                              
                          default:
                              console.log("Unexpected heartbeat state: " + result.state);
                              $interval.cancel(heartbeatTimer);
                      }
                  });
      }
      
      function updateCountDown() {
          countDown--;
          var builder = [];
          builder.push("Join ");
          builder.push(gameStartedBy);
          builder.push("'s game: ");
          builder.push(countDown);
          var response = {
              description: gameStartedBy + " has started a game!",
              startGameLabel: builder.join('')
          };
          callback(response);
          if (countDown === 0) {
              $interval.cancel(heartbeatTimer);
              postHeartbeat();
          }
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
      
      return {
          setCallback: setCallback,
          removeCallback: removeCallback
      };
  }]);

  app.factory('keyTypedService', function() {
      var callbackList = [];
      var currentId = 0;
      
      function addCallback(newCallback) {
          var callbackObj = {
              id: currentId++,
              callback: newCallback
          };
          callbackList.push(callbackObj);
          return callbackObj.id;
      }
      
      function removeCallback(id) {
          var i;
          for (i = 0; i < callbackList.length; i++) {
              if (callbackList[i].id === id) {
                  break;
              }
          }
          callbackList.splice(i , 1);
      }
      
      function notify(keyCode) {
          callbackList.forEach(function(callbackObj) {
              callbackObj.callback(keyCode);
          });
      }
      
      return {
          addCallback: addCallback,
          removeCallback: removeCallback,
          notify: notify
      };
  });
  
  app.service('requestPlayService',
  ['$http', 'gameStateService', 
  function($http, gameStateService) {
      var rps = this;
      
      gameStateService.addCallback(
              gameStateService.states.REQUEST_PLAY, requestPlayState);
      
      function requestPlayState(context) {
          var url = context.player === 'guest' ?
              '/champboggle2015/guest/startgame' :
              '/champboggle2015/api/startgame';
          $http.get(url)
            .success(function(data) {
                var playContext = {
                    player: context.player,
                    letters: data.letters,
                    checkinPoint: data.checkinPoint
                };
                gameStateService.nextState(playContext);
            })
            .error(function() {
                console.log('Error contacting server');
            });
      }
  }]);
  
  app.service('wordFinder', [function() {
        var wf = this;
        var matrix;
        var formingDice;
        var letterCoords = {};
        
        wf.initialise = function() {
            matrix = [];
            formingDice = [];
            letterCoords = {};
        };
        
        wf.setMatrix = function(newMatrix) {
            matrix = newMatrix;
        };
        
        wf.setFormingDice = function(newFormingDice) {
            formingDice = newFormingDice;
        };
        
        wf.addLetterCoords = function(letter, i, j) {
            if (!letterCoords[letter]) {
                letterCoords[letter] = [];
            }
            letterCoords[letter].push({i:i, j:j});
        };

        wf.isAdjacent = function(die, diceList) {
            diceList = diceList || formingDice;
            if (!diceList.length) {
                return true;
            }
            var lastDie = diceList[diceList.length - 1];
            // TODO Make id an object, i,j
            var lasti = Number(lastDie.id[0]);
            var lastj = Number(lastDie.id[1]);
            var newi = Number(die.id[0]);
            var newj = Number(die.id[1]);
          
            return Math.abs(newi - lasti) <= 1 
                && Math.abs(newj - lastj) <= 1;
        };
        
        wf.addAdjacentDie = function(coordsList, diceList, letterList) {
            if (coordsList.length === 0) {
                // Run out of coordinates.  Return empty list.
                return [];
            }
            // Get the die from the head coords
            var die = matrix[coordsList[0].i][coordsList[0].j];
            // If the die is already selected, try the next coords
            if (diceList.indexOf(die) >= 0) {
                return wf.addAdjacentDie(
                        coordsList.slice(1), diceList, letterList);
            }
            // If the die is adjacent to the last die in the dice list then call
            // addLetterListNoBackout to continue evaluating letters.
            if (wf.isAdjacent(die, diceList)) {
                var diceListCopy = diceList.slice();
                diceListCopy.push(die);
                var diceActions = [{die: die, added: true}]
                                   .concat(wf.addLetterList(diceListCopy, 
                                                         letterList.slice(1)));
                
                // If evaluation was successful, return the dice actions.
                // Otherwise try the next coords
                if (diceActions[diceActions.length - 1].success) {
                    return diceActions;
                } else {
                    return wf.addAdjacentDie(
                            coordsList.slice(1), diceList, letterList);
                }
            }
            // Coords were not adjacent so try the next coords
            return wf.addAdjacentDie(coordsList.slice(1), diceList, letterList);
        };
        
        this.addLetterList = function(diceList, letterList) {
            // If we've depleted the letter list then, success!
            if (letterList.length === 0) {
                return [{success: true}];
            }
            // Get the next letter and coordinates of the occurences of that
            // letter
            var letter = letterList[0];
            var die = null;
            var coordsList = letterCoords[letter];
            
            // If there are occurences of the letter then add the letters in
            // the list using the coords list.
            if (coordsList) {
                return wf.addAdjacentDie(coordsList, diceList, letterList);
            } else {
                return [];
            }
        };
  }]);
  
  app.controller('ViewController', 
  ['gameStateService', 'requestPlayService', 'keyTypedService',
  function(gameStateService, requestPlayService, keyTypedService) {
      var vc = this;
      var currentState = gameStateService.states.TITLE;
      
      gameStateService.addCallback(
              gameStateService.states.TITLE, setTitleState);
      gameStateService.addCallback(
              gameStateService.states.PLAY, setPlayState);
      gameStateService.addCallback(
              gameStateService.states.RESULTS, setResultsState);
      gameStateService.addCallback(
              gameStateService.states.LOGIN, setLoginState);
      
      vc.isTitleState = function() {
          return isState(gameStateService.states.TITLE);
      };
      vc.isPlayState = function() {
          return isState(gameStateService.states.PLAY);
      };
      vc.isResultsState = function() {
          return isState(gameStateService.states.RESULTS);
      };
      vc.isLoginState = function() {
          return isState(gameStateService.states.LOGIN);
      };

      vc.keyTyped = function($event) {
          if ($event.keyCode === 8 && vc.isPlayState()) {
              $event.preventDefault();
          }
          keyTypedService.notify($event.keyCode);
      };
      
      function isState(state) {
          return currentState === state;
      }
      
      function setTitleState() {
          currentState = gameStateService.states.TITLE;
      }
      function setPlayState() {
          currentState = gameStateService.states.PLAY;
      }
      function setResultsState() {
          currentState = gameStateService.states.RESULTS;
      }
      function setLoginState() {
          currentState = gameStateService.states.LOGIN;
      }
  }]);

  app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
})();

