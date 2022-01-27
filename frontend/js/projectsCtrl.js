/** @format */

app.controller("ProjectsCtrl", [
  "$http",
  "$scope",
  "common",
  function ($http, $scope, common) {
    let ctrl = this;

    ctrl.projects = [];
    ctrl.project = {};
    ctrl.q = "";
    ctrl.skip = ctrl.limit = 0;

    const projectDefaults = {
      name: "",
      owner: "",
    };

    ctrl.edit = function (index) {
      Object.assign(
        ctrl.project,
        index >= 0 ? ctrl.projects[index] : projectDefaults
      );

      let options = {
        title: index >= 0 ? "Edytuj projekt" : "Nowy projekt ",
        ok: true,
        delete: index >= 0,
        cancel: true,
        data: ctrl.project,
      };
      common.dialog(
        "editProject.html",
        "EditProjectCtrl",
        options,
        function (answer) {
          switch (answer) {
            case "ok":
              if (index >= 0) {
                $http.put("/project", ctrl.project).then(
                  function (res) {
                    ctrl.projects = res.data;
                    common.alert.show("Dane zmienione");
                  },
                  function (err) {}
                );
              } else {
                delete ctrl.project._id;
                $http.post("/project", ctrl.project).then(
                  function (res) {
                    ctrl.projects = res.data;
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
                  ctrl.projects[index].name + " " + ctrl.projects[index].owner,
                ok: true,
                cancel: true,
              };
              common.confirm(options, function (answer) {
                if (answer == "ok") {
                  $http.delete("/contract?project=" + ctrl.projects[index]._id);
                  $http.delete("/project?_id=" + ctrl.projects[index]._id).then(
                    function (res) {
                      ctrl.projects = res.data;
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
          "/project?q=" + ctrl.q + "&limit=" + ctrl.limit + "&skip=" + ctrl.skip
        )
        .then(
          function (res) {
            ctrl.projects = res.data;
          },
          function (err) {}
        );
    };

    ctrl.refreshData();

    $scope.$on("refresh", function (event, parameters) {
      if (
        Array.isArray(parameters.collection) &&
        parameters.collection.includes("projects")
      ) {
        ctrl.refreshData();
      }
    });
  },
]);
