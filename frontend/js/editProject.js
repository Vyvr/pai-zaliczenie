/** @format */

app.controller("EditProjectCtrl", [
  "$http",
  "$uibModalInstance",
  "options",
  function ($http, $uibModalInstance, options) {
    let ctrl = this;
    
    ctrl.options = options;
    ctrl.persons = [];
    ctrl.options.data.owner = null;

    $http.get("/person").then(
      function (res) {
        ctrl.persons = res.data;
        ctrl.person =
          ctrl.persons[0].firstName + " " + ctrl.persons[0].lastName;

        console.log(ctrl.person);
      },
      function (err) {
        console.log("fetching persons failed " + err);
      }
    );

    ctrl.submit = function (answer) {
      $uibModalInstance.close(answer);
    };
    ctrl.cancel = function () {
      $uibModalInstance.dismiss(null);
    };
  },
]);
