/** @format */

const http = require("http");
const url = require("url");
const nodestatic = require("node-static");
const uuid = require("uuid");
const cookies = require("cookies");
const ws = require("ws");

const lib = require("./lib");
const person = require("./person");
const project = require("./project");
const contract = require("./contract");
const db = require("./db");
const auth = require("./auth");
const example = require("./example");
const deposit = require("./deposit");

let server = http.createServer();
let fileServer = new nodestatic.Server("./frontend");

server.on("request", function (req, res) {
  let env = { req, res };

  let appCookies = new cookies(req, res);
  let session = appCookies.get("session");
  let now = Date.now();
  if (!session || !lib.sessions[session]) {
    session = uuid.v4();
    lib.sessions[session] = {
      from: req.connection.remoteAddress,
      created: now,
      touched: now,
    };
  } else {
    lib.sessions[session].from = req.connection.remoteAddress;
    lib.sessions[session].touched = now;
  }
  appCookies.set("session", session, { httpOnly: false });
  env.session = session;

  env.urlParsed = url.parse(req.url, true);
  if (!env.urlParsed.query) env.urlParsed.query = {};

  if (
    !lib.checkPermissions(
      req.method + " " + env.urlParsed.pathname,
      lib.sessions[session].roles
    )
  ) {
    lib.sendError(res, 403, "permission denied");
    return;
  }

  env.payload = "";
  req
    .on("data", function (data) {
      env.payload += data;
    })
    .on("end", function () {
      try {
        env.payload = env.payload ? JSON.parse(env.payload) : {};
      } catch (ex) {
        console.error(
          req.method,
          env.urlParsed.pathname,
          JSON.stringify(env.urlParsed.query),
          "ERROR PARSING:",
          env.payload
        );
        lib.sendError(res, 400, "parsing payload failed");
        return;
      }
      console.log(
        session,
        req.method,
        env.urlParsed.pathname,
        JSON.stringify(env.urlParsed.query),
        JSON.stringify(env.payload)
      );
      switch (env.urlParsed.pathname) {
        case "/auth":
          auth.handle(env);
          break;
        case "/person":
          person.handle(env);
          break;
        case "/project":
          project.handle(env);
          break;
        case "/contract":
          contract.handle(env);
          break;
        case "/deposit":
          deposit.handle(env);
          break;
        default:
          fileServer.serve(req, res);
      }
    });
});

lib.wsServer = new ws.Server({ server });

lib.wsServer.on("connection", function (client) {
  client.on("message", function (message) {
    try {
      message = JSON.parse(message);
      switch (message.type) {
        case "init":
          if (lib.sessions[message.session]) {
            client.session = message.session;
            lib.sessions[message.session].wsClient = client;
            console.log(
              "Websocket connection established for",
              message.session
            );
          }
          break;
        default:
          console.error("WS message not recognized", message);
      }
    } catch (err) {
      console.error("WS message error", err);
    }
  });
});

db.init(function () {
  // for development only
  example.initialize();
  //
  server.listen(7777);
});
