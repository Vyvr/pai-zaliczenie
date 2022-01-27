/** @format */

const ws = require("ws");

const lib = (module.exports = {
  sessions: {}, // { uuid: { }, ... }

  wsServer: null,

  sendJson: function (res, obj = null) {
    res.writeHead(200, { "Content-type": "application/json" });
    if (obj != null) res.write(JSON.stringify(obj));
    res.end();
  },

  sendError: function (res, code, cause = "") {
    console.error(code, cause);
    res.writeHead(code, { "Content-type": "application/json" });
    res.write(JSON.stringify({ cause }));
    res.end();
  },

  // sprawdzenie uprawnien
  permissions: {
    "^GET /person$": ["admin", "user"],
    " /person$": ["admin"],
    " /persons.*\\.html$": ["admin"],
    "^GET /contracts$": ["admin", "owner"],
    " /contracts$": ["admin", "owner"],
    " /contracts.*\\.html$": ["admin", "owner"],
    "^GET /projects$": ["admin", "owner"],
    " /projects$": ["admin", "owner"],
    " /projects.*\\.html$": ["admin", "owner"],
    /*
    // Bogatsza wersja:
    permissions: [
        { req: ' /.*View\.html$', roles: [], error: 'Access denied' },
        { req: '^(POST|PUT|DELETE) ', roles: ['admin'], error: null },
        { req: '^POST /transfer$', roles: ['user'], error: null },
        { req: '^(POST|PUT|DELETE) ', roles: '*', error: 'You have to be logged as admin'  }
    ]

*/
  },

  checkPermissions: function (reqStr, roles) {
    console.log("'" + reqStr + "'");

    let permittedRoles = [];
    for (let pattern in lib.permissions) {
      let regexp = new RegExp(pattern);
      if (regexp.test(reqStr)) {
        permittedRoles = lib.permissions[pattern];
        break;
      }
    }

    // jeśli url ma pustą tablicę ról, jest niechroniony
    if (permittedRoles.length < 1) return true;
    if (!roles || roles.length < 1) return false;

    let intersection = [];
    roles.forEach(function (role) {
      if (permittedRoles.includes(role)) intersection.push(role);
    });
    return intersection.length > 0;
  },

  broadcast: function (data, selector = null) {
    let n = 0;
    lib.wsServer.clients.forEach(function (client) {
      if (client.readyState == ws.OPEN && (!selector || selector(client))) {
        client.send(JSON.stringify(data));
        n++;
      }
    });
    console.log("Sending a message", JSON.stringify(data), "to", n, "clients");
  },
});
