app.controller('TransfersCtrl', [ '$http', 'common', function($http, common) {
    let ctrl = this
    
    ctrl.checkPermissions = common.checkPermissions
    
    ctrl.transfer = { amount: 0, recipient: null }
    
    ctrl.deposit = function() {
        let options = { 
            title: 'Dane transferu',
            ok: true,
            cancel: true,
            data: ctrl.transfer
        }
        common.dialog('makeTransfer.html', 'MakeTransferCtrl', options, function(answer) {
            if(answer == 'ok') {
                $http.post('/deposit', ctrl.transfer).then(
                    function(res) {
                        $http.get('/person?_id=' + ctrl.transfer.recipient).then(
                            function(res) {
                                common.alert.show('Wpłaciłeś ' + ctrl.transfer.amount + ' PLN dla ' + res.data.firstName + ' ' + res.data.lastName)
                            },
                            function(err) {}
                        )
                    },
                    function(err) {
                        common.alert.show('Wpłata nieudana', 'alert-danger')
                    }
                )
            }
        })
    }

}])