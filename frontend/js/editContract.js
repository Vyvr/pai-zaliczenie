/** @format */

app.controller("EditContractCtrl", [
  "$http",
  "$uibModalInstance",
  "options",
  function ($http, $uibModalInstance, options) {
    let ctrl = this;

    ctrl.options = options;
    ctrl.persons = [];
    ctrl.projects = [];

    $http.get("/person").then(
      function (res) {
        ctrl.persons = res.data;
        ctrl.person =
          ctrl.persons[0].firstName + " " + ctrl.persons[0].lastName;
      },
      function (err) {
        console.log("fetching persons failed " + err);
      }
    );

    $http.get("/project").then(
      function (res) {
        ctrl.projects = res.data;
        ctrl.project = ctrl.projects[0]._id;
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
