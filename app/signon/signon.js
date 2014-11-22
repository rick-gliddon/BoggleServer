(function() {
    angular.module('signOnModule', ['ui.bootstrap'])
    .service('signOnBoggle', ['$modal',
        function ($modal) {

            this.show = function () {
                
                return $modal.open({
                    backdrop: true,
                    keyboard: true,
                    modalFade: true,
                    templateUrl: 'signon/signon.html',
                    controller: 'SignOnBoggleController as signOnCtrl'
                }).result;
            };

    }])
    .controller('SignOnBoggleController', ['$scope', '$modalInstance', '$http', '$window',
      function($scope, $modalInstance, $http, $window) {
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
                    $modalInstance.close(ctrl.existing.user);
                  })
                .error(function (data, status, headers, config) {
                    // Erase the token if the user fails to log in
                    delete $window.sessionStorage.token;
                    ctrl.loginErrorMessage = "Incorrect username or password";
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
            var username = ctrl.new.user;
            resetCtrl();
            $modalInstance.close(username);
        };
        
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