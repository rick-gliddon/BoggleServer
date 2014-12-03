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
    var foundWords = {};
    var finalResult = {};
    
    function setFoundWords(words) {
        foundWords = words;
    }
    function getFoundWords() {
        return foundWords;
    }
    function setFinalResults(result) {
        finalResult = result;
    }
    function getFinalResults() {
        return finalResult;
    }

    return {
        setFoundWords: setFoundWords,
        getFoundWords: getFoundWords,
        setFinalResults: setFinalResults,
        getFinalResults: getFinalResults
    };

  });

app.config(function ($httpProvider) {
  $httpProvider.interceptors.push('authInterceptor');
});
})();

