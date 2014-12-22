(function() {

  var app = angular.module('bogglesim',['title', 'play', 'results']);

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
          RESULTS : 3
      };
      var numStates = 4;
      var currentState = states.TITLE;

      function addCallback(state, newCallback) {
          var callbackObj = {state: state, callback: newCallback};
          callbackList.push(callbackObj);
      }

      function nextState(context) {
          advanceState();
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
          $http.get('/champboggle2015/api/startgame')
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
      
      vc.isTitleState = function() {
          return isState(gameStateService.states.TITLE);
      };
      vc.isPlayState = function() {
          return isState(gameStateService.states.PLAY);
      };
      vc.isResultsState = function() {
          return isState(gameStateService.states.RESULTS);
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
  }]);

  app.config(function ($httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');
  });
})();

