(function() {
    
    angular.module('state', [])
           .controller('StateController', ['$rootScope', '$scope', '$http', function($rootScope, $scope, $http) {
                    
    var sc = this;
    
    sc.StateEnum = {
        TITLE : "Title",
        REQUEST_PLAY : "RequestPlay",
        PLAY : "Play",
        REQUEST_RESULTS : "RequestResults",
        RESULTS : "Results"
    };
    
    var state = sc.StateEnum.TITLE;
    
    sc.isTitleState = function() {
        return state === sc.StateEnum.TITLE
            || state === sc.StateEnum.REQUEST_PLAY;
    };
    
    sc.isPlayState = function() {
        return state === sc.StateEnum.PLAY;
    };
    
    sc.nextState = function() {
        switch (state) {
            case sc.StateEnum.TITLE:
                state = sc.StateEnum.REQUEST_PLAY;
                requestPlay();
                break;
            case sc.StateEnum.REQUEST_PLAY:
                state = sc.StateEnum.PLAY;
                break;
            case sc.StateEnum.PLAY:
                state = sc.StateEnum.REQUEST_RESULTS;
                break;
            default:
                break;
        }
    };
    
    function requestPlay() {
        $http.get('/champboggle2015/api/startgame')
            .success(function(data) {
                angular.extend($scope, data);
                sc.nextState();
            })
            .error(function() {
                console.log('Error contacting server');
            });
    }
  }]);
})();