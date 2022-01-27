app.controller("LoginCtrl", [ '$http', '$uibModalInstance', 'common', function($http, $uibModalInstance, common) {
    let ctrl = this

    ctrl.login = ''
    ctrl.password = ''

    ctrl.doLogin = function() {

        $http.post('/auth', { login: ctrl.login, password: ctrl.password }).then(
            function(rep) {
                common.login = rep.data.login
                $uibModalInstance.close(common.login)
            },
            function(err) {
                common.login = null
                $uibModalInstance.close()
            }
        );
    };

    ctrl.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    }

}])