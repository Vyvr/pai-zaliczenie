/** @format */

app.controller("MakeTransferCtrl", [
  "$http",
  "$uibModalInstance",
  "options",
  function ($http, $uibModalInstance, options) {
    let ctrl = this;
    ctrl.options = options;
    ctrl.persons = [];
    ctrl.options.data.recipient = null;

    ctrl.submit = function (answer) {
      $uibModalInstance.close(answer);
    };
    ctrl.cancel = function () {
      $uibModalInstance.dismiss(null);
    };

    $http.get("/person").then(
      function (res) {
        ctrl.persons = res.data;
        ctrl.options.data.recipient = ctrl.persons[0]._id;
      },
      function (err) {}
    );
  },
]);
