(function() {
    
  var app = angular.module('bogglesim',['state', 'title', 'play', 'results']);
  
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
  
  app.factory('gameResults', function() {
      var callbackList = [];
      
      function addCallback(newCallback) {
          if (callbackList.indexOf(newCallback) < 0) {
              callbackList.push(newCallback);
          }
      }
      
      function removeCallback(remCallback) {
          var index = callbackList.indexOf(remCallback);
          if (index >= 0) {
              callbackList.splice(index, 1);
          }
      }
      
      function notify(matrix, playerWords, finalResults) {
          callbackList.forEach(function(callback) {
              callback(matrix, playerWords, finalResults);
          });
      }
      
      return {
          addCallback : addCallback,
          removeCallback : removeCallback,
          notify : notify
      };
  });

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});
})();

