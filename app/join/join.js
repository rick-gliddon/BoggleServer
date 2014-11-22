(function() {
    angular.module('joinModule', ['ui.bootstrap'])
    .service('joinBoggle', ['$modal',
        function ($modal) {

            this.show = function () {
                
                return $modal.open({
                    backdrop: true,
                    keyboard: true,
                    modalFade: true,
                    templateUrl: 'join/join.html',
                    controller: 'JoinBoggleController as joinCtrl'
                }).result;
            };

        }])
        .controller('JoinBoggleController', ['$scope', '$modalInstance', function($scope, $modalInstance) {
            var ctrl = this;
            ctrl.ok = function (result) {
                $modalInstance.close('A-OK');
            };
            ctrl.cancel = function () {
                $modalInstance.dismiss('Cancelled Yo');
            };
        }]);
})();