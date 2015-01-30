(function() {
    
    angular.module('login', [])
    .directive('boggleLogin', function () {

        return {
            restrict: 'E',
            scope: {},
            templateUrl: 'login/login.html',
            controller: 'BoggleLoginController',
            controllerAs: 'loginCtrl'
        };
    })
    .controller('BoggleLoginController',
    ['$scope', '$http', '$window', 'gameStateService',
    function($scope, $http, $window, gameStateService) {
        var ctrl = this;
    
        var newAccount = false;
        var accountCreated = false;
        
        ctrl.existing = {
            user: '',
            password: ''
        };
        ctrl.new = {
            user: '',
            password: ''
        };
        ctrl.newReEnter = '';
        ctrl.showCreationError = false;
        ctrl.showLoginError = false;
        ctrl.creationErrorMessage = '';
        ctrl.loginErrorMessage = '';

        ctrl.isAccountCreated = function() {
            return accountCreated;
        };
        
        function setAccountCreated(created) {
            accountCreated = created;
        };

        ctrl.isNewAccount = function() {
            return newAccount;
        };
        
        ctrl.setNewAccount = function(createNewAccount) {
            newAccount = createNewAccount;
        };
        
        ctrl.cancel = function() {
            closeAndReturnUser('guest');
        };
        
        function isPasswordMatch() {
            return ctrl.new.password === ctrl.newReEnter;
        };
        
        ctrl.validatePassword = function() {
            ctrl.creationErrorMessage = "Passwords do not match";
            ctrl.showCreationError = !isPasswordMatch();
            return isPasswordMatch();
        };

        ctrl.loginPlayer = function () {
            $http.post('/champboggle2015/auth/login', ctrl.existing)
                .success(function (data, status, headers, config) {
                    $window.sessionStorage.token = data.token;
                    closeAndReturnUser(ctrl.existing.user);
                  })
                .error(function (data, status, headers, config) {
                    // Erase the token if the user fails to log in
                    delete $window.sessionStorage.token;
                    ctrl.loginErrorMessage = data;
                    ctrl.showLoginError = true;
                  });
        };
        
        ctrl.createPlayer = function () {
            $http.post('/champboggle2015/auth/create', ctrl.new)
                .success(function (data, status, headers, config) {
                    $window.sessionStorage.token = data.token;
                    setAccountCreated(true);
                  })
                .error(function (data, status, headers, config) {
                    // Erase the token if the user fails to log in
                    delete $window.sessionStorage.token;
                    ctrl.creationErrorMessage = data;
                    ctrl.showCreationError = true;
                  });
        };
        
        ctrl.playBoggle = function() {
            closeAndReturnUser(ctrl.new.user);
        };
        
        function closeAndReturnUser(username) {
            resetCtrl();
            gameStateService.quit({player: username});
        }
        
        function resetCtrl() {
            setAccountCreated(false);
            ctrl.setNewAccount(false);
            ctrl.existing = {
                user: '',
                password: ''
            };
            ctrl.new = {
                user: '',
                password: ''
            };
            ctrl.showCreationError = false;
            ctrl.showLoginError = false;
            ctrl.creationErrorMessage = '';
            ctrl.loginErrorMessage = '';
        }
    }]);
})();