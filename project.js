/** @format */

const { persons } = require("./db");
const db = require("./db");
const lib = require("./lib");

const project = (module.exports = {
  handle: function (env) {
    const validate = function (project) {
      let result = {
        name: project.name,
        owner:
          typeof project.owner === "string"
            ? db.ObjectId(project.owner)
            : project.owner,
        ownerFullname: project.ownerFullName,
      };
      return result.name && result.owner ? result : null;
    };

    let _id, project;
    let q = env.urlParsed.query.q ? env.urlParsed.query.q : "";

    const sendAllProjects = function (q = "") {
      db.projects
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
              localField: "owner",
              foreignField: "_id",
              as: "ownerFullName",
            },
          },
        ])
        .toArray(function (err, projects) {
          if (!err) {
            projects.forEach((project) => {
              project.ownerFullName =
                project &&
                project.ownerFullName &&
                Array.isArray(project.ownerFullName) &&
                project.ownerFullName[0] &&
                project.ownerFullName[0].firstName &&
                project.ownerFullName[0].lastName
                  ? project.ownerFullName[0].firstName +
                    " " +
                    project.ownerFullName[0].lastName
                  : undefined;
            });
            lib.sendJson(env.res, projects);
          } else {
            lib.sendError(env.res, 400, "projects.aggregate() failed " + err);
          }
        });
    };

    if (env.req.method == "POST" || env.req.method == "PUT") {
      project = validate(env.payload);
      if (!project) {
        lib.sendError(env.res, 400, "invalid payload");
        return;
      }
    }

    switch (env.req.method) {
      case "GET":
        _id = db.ObjectId(env.urlParsed.query._id);
        if (_id) {
          db.projects.findOne({ _id }, function (err, result) {
            lib.sendJson(env.res, result);
          });
        } else {
          sendAllProjects(q);
        }
        break;
      case "POST":
        db.projects.insertOne(project, function (err, result) {
          if (!err) {
            sendAllProjects(q);
            project.operation = "addProject";
            lib.broadcast(project, function (client) {
              if (client.session === env.session) return false;
              let session = lib.sessions[client.session];
              return (
                session &&
                session.roles &&
                Array.isArray(session.roles) &&
                session.roles.includes("admin")
              );
            });
          } else {
            lib.sendError(env.res, 400, "projects.insertOne() failed");
          }
        });
        break;
      case "DELETE":
        _id = db.ObjectId(env.urlParsed.query._id);
        if (_id) {
          db.projects.findOneAndDelete({ _id }, function (err, result) {
            if (!err) {
              sendAllProjects(q);
              result.operation = "addProject";
              lib.broadcast(result, function (client) {
                if (client.cession === env.session) return false;
                let session = lib.sessions[client.session];
                return (
                  session &&
                  session.roles &&
                  Array.isArray(session.roles) &&
                  session.roles.includes("admin")
                );
              });
            } else {
              lib.sendError(env.res, 400, "projects.findOneAndDelete() failed");
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
          db.projects.findOneAndUpdate(
            { _id },
            { $set: project },
            { returnOriginal: false },
            function (err, result) {
              if (!err) {
                sendAllProjects(q);
                result.operation = "addProject";
                lib.broadcast(result, function (client) {
                  if (client.cession === env.session) return false;
                  let session = lib.sessions[client.session];
                  return (
                    session &&
                    session.roles &&
                    Array.isArray(session.roles) &&
                    session.roles.includes("admin")
                  );
                });
              } else {
                lib.sendError(
                  env.res,
                  400,
                  "projects.findOneAndUpdate() failed"
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
