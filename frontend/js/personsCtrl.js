/** @format */

app.controller("PersonsCtrl", [
  "$http",
  "$scope",
  "common",
  function ($http, $scope, common) {
    let ctrl = this;

    ctrl.persons = [];
    ctrl.person = {};
    ctrl.q = "";
    ctrl.skip = ctrl.limit = 0;

    const personDefaults = {
      firstName: "",
      lastName: "",
      year: 2000,
    };

    ctrl.edit = function (index) {
      Object.assign(
        ctrl.person,
        index >= 0 ? ctrl.persons[index] : personDefaults
      );
      delete ctrl.person.balance;
      delete ctrl.person.transactions;
      let options = {
        title: index >= 0 ? "Edytuj dane" : "Nowe dane ",
        ok: true,
        delete: index >= 0,
        cancel: true,
        data: ctrl.person,
      };
      common.dialog(
        "editPerson.html",
        "EditPersonCtrl",
        options,
        function (answer) {
          switch (answer) {
            case "ok":
              if (index >= 0) {
                $http.put("/person", ctrl.person).then(
                  function (res) {
                    ctrl.persons = res.data;
                    common.alert.show("Dane zmienione");
                  },
                  function (err) {}
                );
              } else {
                delete ctrl.person._id;
                $http.post("/person", ctrl.person).then(
                  function (res) {
                    ctrl.persons = res.data;
                    common.alert.show("Dane dodane");
                  },
                  function (err) {}
                );
              }
              break;
            case "delete":
              let options = {
                title: "Usunąć obiekt?",
                body:
                  ctrl.persons[index].firstName +
                  " " +
                  ctrl.persons[index].lastName,
                ok: true,
                cancel: true,
              };
              common.confirm(options, function (answer) {
                if (answer == "ok") {
                  $http.delete("/person?_id=" + ctrl.persons[index]._id).then(
                    function (res) {
                      ctrl.persons = res.data;
                      common.alert.show("Dane usunięte");
                    },
                    function (err) {}
                  );
                }
              });
              break;
          }
        }
      );
    };

    ctrl.refreshData = function () {
      $http
        .get(
          "/person?q=" + ctrl.q + "&limit=" + ctrl.limit + "&skip=" + ctrl.skip
        )
        .then(
          function (res) {
            ctrl.persons = res.data;
          },
          function (err) {}
        );
    };

    ctrl.refreshData();

    $scope.$on("refresh", function (event, parameters) {
      if (
        Array.isArray(parameters.collection) &&
        (parameters.collection.includes("persons") ||
          parameters.collection.includes("transactions"))
      ) {
        ctrl.refreshData();
      }
    });
  },
]);
