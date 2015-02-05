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

