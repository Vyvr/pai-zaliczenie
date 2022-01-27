/** @format */

const db = require("./db");
const lib = require("./lib");

const contract = (module.exports = {
  handle: function (env) {
    const validate = function (contract) {
      let result = {
        name: contract.name,
        executorName: contract.executorName,
        projectName: contract.projectName,
        start: new Date(contract.start.toString()).toISOString().split("T")[0],
        end: new Date(contract.end.toString()).toISOString().split("T")[0],
        salary: contract.salary,
        executor:
          typeof contract.executor === "string"
            ? db.ObjectId(contract.executor)
            : contract.executor,
        project:
          typeof contract.project === "string"
            ? db.ObjectId(contract.project)
            : contract.project,
        commited:
          typeof contract.commited === "boolean"
            ? contract.commited
            : Boolean(contract.commited),
      };
      return result.name &&
        result.executor &&
        result.start &&
        result.end &&
        result.project &&
        result.salary
        ? result
        : null;
    };

    let _id, contract;
    let q = env.urlParsed.query.q ? env.urlParsed.query.q : "";

    const sendAllContracts = function (q = "") {
      db.contracts
        .aggregate([
          {
            $match: {
              $or: [
                { name: { $regex: RegExp(q, "i") } },
                { owner: { $regex: RegExp(q, "i") } },
              ],
            },
          },
          {
            $lookup: {
              from: "persons",
              localField: "executor",
              foreignField: "_id",
              as: "executorName",
            },
          },
          {
            $lookup: {
              from: "projects",
              localField: "project",
              foreignField: "_id",
              as: "projectName",
            },
          },
        ])
        .toArray(function (err, contracts) {
          if (!err) {
            contracts.forEach((contract) => {
              contract.executorName =
                contract &&
                contract.executorName &&
                Array.isArray(contract.executorName) &&
                contract.executorName[0] &&
                contract.executorName[0].firstName &&
                contract.executorName[0].lastName
                  ? contract.executorName[0].firstName +
                    " " +
                    contract.executorName[0].lastName
                  : undefined;

              if (contract.projectName) {
                contract.projectName = contract.projectName[0].name;
              }
            });
            lib.sendJson(env.res, contracts);
          } else {
            lib.sendError(env.res, 400, "contracts.aggregate() failed " + err);
          }
        });
    };

    if (env.req.method == "POST" || env.req.method == "PUT") {
      contract = validate(env.payload);
      if (!contract) {
        lib.sendError(env.res, 400, "invalid payload");
        return;
      }
    }

    switch (env.req.method) {
      case "GET":
        _id = db.ObjectId(env.urlParsed.query._id);
        if (_id) {
          db.contracts.findOne({ _id }, function (err, result) {
            lib.sendJson(env.res, result);
          });
        } else {
          sendAllContracts(q);
        }
        break;
      case "POST":
        db.contracts.insertOne(contract, function (err, result) {
          if (!err) {
            sendAllContracts(q);
            contract.operation = "addContract";
            lib.broadcast(contract, function (client) {
              if (client.session === env.session) return false;
              let session = lib.sessions[client.session];
              return (
                session &&
                session.roles &&
                Array.isArray(session.roles) &&
                (session.roles.includes("admin") ||
                  session.roles.includes("owner"))
              );
            });
          } else {
            lib.sendError(env.res, 400, "contracts.insertOne() failed");
          }
        });
        break;
      case "DELETE":
        _id = db.ObjectId(env.urlParsed.query._id);
        project = db.ObjectId(env.urlParsed.query.project);
        if (_id) {
          db.contracts.findOneAndDelete({ _id }, function (err, result) {
            if (!err) {
              sendAllContracts(q);
              result.operation = "addContract";
              lib.broadcast(result, function (client) {
                if (client.cession === env.session) return false;
                let session = lib.sessions[client.session];
                return (
                  session &&
                  session.roles &&
                  Array.isArray(session.roles) &&
                  (session.roles.includes("admin") ||
                    session.roles.includes("owner"))
                );
              });
            } else {
              lib.sendError(
                env.res,
                400,
                "contracts.findOneAndDelete() failed"
              );
            }
          });
        } else if (project) {
          db.contracts.deleteMany({ project }, function (err, result) {
            if (!err) {
              sendAllContracts(q);
            } else {
              lib.sendError(env.res, 400, "contracts.deleteMany() failed");
            }
          });
        } else {
          lib.sendError(
            env.res,
            400,
            "broken _id for delete " + env.urlParsed.query._id
          );
        }
        break;
      case "PUT":
        _id = db.ObjectId(env.payload._id);
        if (_id) {
          db.contracts.findOneAndUpdate(
            { _id },
            { $set: contract },
            { returnOriginal: false },
            function (err, result) {
              if (!err) {
                sendAllContracts(q);
                result.operation = "addContract";
                lib.broadcast(result, function (client) {
                  if (client.cession === env.session) return false;
                  let session = lib.sessions[client.session];
                  return (
                    session &&
                    session.roles &&
                    Array.isArray(session.roles) &&
                    (session.roles.includes("admin") ||
                      session.roles.includes("owner"))
                  );
                });
              } else {
                lib.sendError(
                  env.res,
                  400,
                  "contracts.findOneAndUpdate() failed"
                );
              }
            }
          );
        } else {
          lib.sendError(
            env.res,
            400,
            "broken _id for update " + env.urlParsed.query._id
          );
        }
        break;
      default:
        lib.sendError(env.res, 405, "method not implemented");
    }
  },
});
