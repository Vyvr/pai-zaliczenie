/** @format */

const db = require("./db");
const lib = require("./lib");

const person = (module.exports = {
  handle: function (env) {
    const validate = function (person) {
      let result = {
        firstName: person.firstName,
        lastName: person.lastName,
        year: person.year,
      };
      return result.firstName && result.lastName && !isNaN(result.year)
        ? result
        : null;
    };

    let _id, person;
    let q = env.urlParsed.query.q ? env.urlParsed.query.q : "";
    let skip = env.urlParsed.query.skip
      ? parseInt(env.urlParsed.query.skip)
      : 0;
    skip = isNaN(skip) || skip < 0 ? 0 : skip;
    let limit = env.urlParsed.query.limit
      ? parseInt(env.urlParsed.query.limit)
      : 0;
    limit = isNaN(limit) || limit <= 0 ? 999999 : limit;

    const sendAllPersons = function (q = "") {
      db.persons
        .aggregate([
          {
            $match: {
              $or: [
                { firstName: { $regex: RegExp(q, "i") } },
                { lastName: { $regex: RegExp(q, "i") } },
              ],
            },
          },
          { $skip: skip },
          { $limit: limit },
          {
            $lookup: {
              from: "transactions",
              localField: "_id",
              foreignField: "recipient",
              as: "transactions",
            },
          },
          {
            $addFields: {
              balance: { $sum: "$transactions.amount" },
              transactions: { $size: "$transactions" },
            },
          },
        ])
        .toArray(function (err, persons) {
          if (!err) {
            lib.sendJson(env.res, persons);
          } else {
            lib.sendError(env.res, 400, "persons.aggregate() failed " + err);
          }
        });
    };

    if (env.req.method == "POST" || env.req.method == "PUT") {
      person = validate(env.payload);
      if (!person) {
        lib.sendError(env.res, 400, "invalid payload");
        return;
      }
    }

    switch (env.req.method) {
      case "GET":
        _id = db.ObjectId(env.urlParsed.query._id);
        if (_id) {
          db.persons.findOne({ _id }, function (err, result) {
            lib.sendJson(env.res, result);
          });
        } else {
          sendAllPersons(q);
        }
        break;
      case "POST":
        db.persons.insertOne(person, function (err, result) {
          if (!err) {
            sendAllPersons(q);
            person.operation = "person";
            lib.broadcast(person, function (client) {
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
            lib.sendError(env.res, 400, "persons.insertOne() failed");
          }
        });
        break;
      case "DELETE":
        _id = db.ObjectId(env.urlParsed.query._id);
        if (_id) {
          db.persons.findOneAndDelete({ _id }, function (err, result) {
            if (!err) {
              sendAllPersons(q);
              result.operation = "person";
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
              lib.sendError(env.res, 400, "persons.findOneAndDelete() failed");
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
          db.persons.findOneAndUpdate(
            { _id },
            { $set: person },
            { returnOriginal: false },
            function (err, result) {
              if (!err) {
                sendAllPersons(q);
                result.operation = "person";
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
                  "persons.findOneAndUpdate() failed"
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
