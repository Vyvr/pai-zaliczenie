/** @format */

const db = require("./db");
const lib = require("./lib");

const deposit = (module.exports = {
  handle: function (env) {
    const validate = function (depositData) {
      let result = {
        recipient: db.ObjectId(depositData.recipient),
        amount: depositData.amount,
      };
      return result.recipient && result.amount > 0 ? result : null;
    };

    let depositData = validate(env.payload);
    if (!depositData) {
      lib.sendError(env.res, 400, "invalid payload");
      return;
    }
    depositData.when = Date.now();
    switch (env.req.method) {
      case "POST":
        db.transactions.insertOne(depositData, function (err, result) {
          if (!err) {
            lib.sendJson(env.res, depositData);
            depositData.operation = "deposit";
            lib.broadcast(depositData, function (client) {
              if (client.session == env.session) return false; // nie wysyłaj wiadomości do sprawcy
              let session = lib.sessions[client.session];
              return (
                session &&
                session.roles &&
                Array.isArray(session.roles) &&
                session.roles.includes("admin")
              );
            });
          } else {
            lib.sendError(env.res, 400, "transactions.insertOne() failed");
          }
        });
        break;
      default:
        lib.sendError(env.res, 405, "method not implemented");
    }
  },
});
