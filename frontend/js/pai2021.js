/** @format */

let app = angular.module("pai2021", [
  "ngRoute",
  "ngSanitize",
  "ngAnimate",
  "ui.bootstrap",
  "ngCookies",
  "ws",
]);

// websocket config
app.config([
  "wsProvider",
  function (wsProvider) {
    wsProvider.setUrl("ws://" + window.location.host);
  },
]);

// router menu
app.constant("routes", [
  {
    route: "/",
    templateUrl: "homeView.html",
    controller: "HomeCtrl",
    controllerAs: "ctrl",
    menu: '<i class="fa fa-lg fa-home"></i>',
  },
  {
    route: "/persons",
    templateUrl: "personsView.html",
    controller: "PersonsCtrl",
    controllerAs: "ctrl",
    menu: "Osoby",
    roles: ["admin"],
  },
  {
    route: "/transfers",
    templateUrl: "transfersView.html",
    controller: "TransfersCtrl",
    controllerAs: "ctrl",
    menu: "Transfery",
    roles: ["admin", "user"],
  },
  {
    route: "/contracts",
    templateUrl: "contractsView.html",
    controller: "ContractsCtrl",
    controllerAs: "ctrl",
    menu: "Kontrakty",
    roles: ["admin", "owner"],
  },

  {
    route: "/projects",
    templateUrl: "projectsView.html",
    controller: "ProjectsCtrl",
    controllerAs: "ctrl",
    menu: "Projekty",
    roles: ["admin"],
  },
]);

// instalacja routera
app.config([
  "$routeProvider",
  "$locationProvider",
  "routes",
  function ($routeProvider, $locationProvider, routes) {
    $locationProvider.hashPrefix("");
    for (var i in routes) {
      $routeProvider.when(routes[i].route, routes[i]);
    }
    $routeProvider.otherwise({ redirectTo: "/" });
  },
]);

// usługi wspólne
app.service("common", [
  "$cookies",
  "$uibModal",
  function ($cookies, $uibModal) {
    let common = this;

    common.login = null;
    common.roles = [];
    common.session = $cookies.get("session");

    common.alert = {
      text: "",
      type: "alert-success",
      show: function (text, type = "alert-success") {
        common.alert.type = type;
        common.alert.text = text;
        console.log(type, ":", text);
      },
      close: function () {
        common.alert.text = "";
      },
    };

    // general modal dialog
    common.dialog = function (templateUrl, controllerName, options, nextTick) {
      let modalInstance = $uibModal.open({
        animation: true,
        ariaLabelledBy: "modal-title-top",
        ariaDescribedBy: "modal-body-top",
        templateUrl: templateUrl,
        controller: controllerName,
        controllerAs: "ctrl",
        resolve: {
          options: function () {
            return options;
          },
        },
      });

      modalInstance.result.then(
        function (answer) {
          nextTick(answer);
        },
        function () {
          nextTick(null);
        }
      );
    };

    // confirmation dialog function
    common.confirm = function (options, nextTick) {
      common.dialog("confirmDialog.html", "ConfirmDialog", options, nextTick);
    };

    // sprawdzenie uprawnien
    let permissions = {
      deposit: ["admin", "user", "owner"],
    };

    common.checkPermissions = function (activity) {
      // jeśli ktoś nie pełni żadnej roli, zabroń
      if (!common.roles || common.roles.length < 1) return false;
      // jeśli aktywność nie ma swoich ról dostępu, zezwól
      if (!permissions[activity] || permissions[activity].length < 1)
        return true;

      let intersection = [];
      permissions[activity].forEach(function (role) {
        if (common.roles.includes(role)) intersection.push(role);
      });
      return intersection.length > 0;
    };
  },
]);

// confirmation dialog controller
app.controller("ConfirmDialog", [
  "$uibModalInstance",
  "options",
  function ($uibModalInstance, options) {
    let ctrl = this;
    ctrl.options = options;

    ctrl.submit = function (answer) {
      $uibModalInstance.close(answer);
    };
    ctrl.cancel = function () {
      $uibModalInstance.dismiss("cancel");
    };
  },
]);

app.controller("ContainerCtrl", [
  "$http",
  "$location",
  "$scope",
  "$uibModal",
  "ws",
  "common",
  "routes",
  function ($http, $location, $scope, $uibModal, ws, common, routes) {
    let ctrl = this;
    ctrl.alert = common.alert;

    // budowanie menu
    ctrl.menu = [];

    let rebuildMenu = function () {
      ctrl.menu.length = 0;
      // kim jestem
      $http.get("/auth").then(
        function (res) {
          common.login = res.data.login;
          common.roles = res.data.roles;
          for (let i in routes) {
            let intersection = [];
            if (routes[i].roles && common.roles) {
              routes[i].roles.forEach(function (role) {
                if (common.roles.includes(role)) intersection.push(role);
              });
            }
            if (!routes[i].roles || intersection.length > 0) {
              ctrl.menu.push({ route: routes[i].route, title: routes[i].menu });
            }
          }
          $location.path("/");
        },
        function (err) {
          common.login = null;
          ctrl.menu.length = 0;
        }
      );
    };

    // kontrola nad menu zwiniętym i rozwiniętym
    ctrl.isCollapsed = true;
    $scope.$on("$routeChangeSuccess", function () {
      ctrl.isCollapsed = true;
    });

    // sprawdzenie która pozycja menu jest wybrana
    ctrl.navClass = function (page) {
      return page === $location.path() ? "active" : "";
    };

    // ikona login/logout
    ctrl.loginIcon = function () {
      return common.login
        ? common.login + '&nbsp;<span class="fa fa-lg fa-sign-out"></span>'
        : '<span class="fa fa-lg fa-sign-in"></span>';
    };

    // logowanie/wylogowanie
    ctrl.login = function () {
      if (common.login) {
        // log out
        common.confirm(
          {
            title: "Uwaga!",
            body: "Czy na pewno chcesz się wylogować?",
            ok: true,
            cancel: true,
          },
          function (answer) {
            if (answer) {
              $http.delete("/auth").then(
                function (rep) {
                  rebuildMenu();
                },
                function (err) {}
              );
            }
          }
        );
      } else {
        // log in
        var modalInstance = $uibModal.open({
          animation: true,
          ariaLabelledBy: "modal-title-top",
          ariaDescribedBy: "modal-body-top",
          templateUrl: "loginDialog.html",
          controller: "LoginCtrl",
          controllerAs: "ctrl",
        });

        modalInstance.result.then(
          function (ret) {
            if (ret) {
              rebuildMenu();
              common.alert.show("Witaj na pokładzie, " + ret, "alert-success");
            } else {
              common.alert.show("Logowanie nieudane", "alert-danger");
            }
          },
          function () {}
        );
      }
    };

    rebuildMenu();

    // websocket initialization
    let wsInitMessage = { type: "init", session: common.session };
    ws.send(JSON.stringify(wsInitMessage));
    ws.on("message", function (messageEvent) {
      console.log("Message from backend", messageEvent.data);
      try {
        let message = JSON.parse(messageEvent.data);
        switch (message.operation) {
          case "deposit":
            $scope.$broadcast("refresh", { collection: ["persons"] });
            break;
          case "addProject":
            $scope.$broadcast("refresh", {
              collection: ["projects", "contracts"],
            });
            break;
          case "addContract":
            $scope.$broadcast("refresh", { collection: ["contracts"] });
            break;
          case "person":
            $scope.$broadcast("refresh", {
              collection: ["persons", "contracts", "projects"],
            });
            break;
        }
      } catch (ex) {
        console.error("Data from backend is not JSON");
      }
    });
  },
]);
