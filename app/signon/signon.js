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
    .controller('SignOnBoggleController', ['$scope', '$modalInstance', function($scope, $modalInstance) {
        var ctrl = this;
    
        var newAccount = false;

        ctrl.isNewAccount = function() {
            return newAccount;
        }
        
        ctrl.setNewAccount = function(createNewAccount) {
            newAccount = createNewAccount;
        }

        ctrl.loginPlayer = function (result) {
            console.log("Logging Player In");
            $modalInstance.close('Login');
        };
        ctrl.createPlayer = function () {
            console.log("Creating Player");
            $modalInstance.close('Create');
        };
    }]);
})();