/** @format */

const db = require("./db");

const example = (module.exports = {
  persons: [
    {
      _id: db.ObjectId("618be4ba6b0df02e94319c15"),
      firstName: "Johnny",
      lastName: "Walker",
      year: 1969,
    },
    {
      _id: db.ObjectId("618beab56b0df02e94319c18"),
      firstName: "Jim",
      lastName: "Beam",
      year: 1684,
    },
    {
      _id: db.ObjectId("618bed4bdad4eb43c178c7b4"),
      firstName: "Jack",
      lastName: "Daniels",
      year: 1886,
    },
  ],

  users: [
    {
      _id: db.ObjectId("61af980faabcf8eda55e491c"),
      login: "admin",
      password: "admin1",
      roles: ["admin"],
    },
    {
      _id: db.ObjectId("61af9854aabcf8eda55e491e"),
      login: "user",
      password: "user1",
      roles: ["user"],
    },

    {
      _id: db.ObjectId("ffaf9854aabcf8eda55e49ff"),
      login: "Kierownik Piotr",
      password: "kierownik",
      roles: ["user", "owner"],
    },
  ],

  projects: [
    {
      _id: db.ObjectId("61af9854aabcf8eda55e49ff"),
      name: "Project 1",
      owner: db.ObjectId("618be4ba6b0df02e94319c15"),
    },
    {
      _id: db.ObjectId("61af9854aabcf8eda55e49aa"),
      name: "Project 2",
      owner: db.ObjectId("618beab56b0df02e94319c18"),
    },
  ],

  contracts: [
    {
      _id: db.ObjectId("61af9854aabcf8eda55e49ff"),
      project: db.ObjectId("61af9854aabcf8eda55e49ff"),
      executor: db.ObjectId("618bed4bdad4eb43c178c7b4"),
      name: "contract 1",
      start: new Date("<1998-04-18>").toISOString().split("T")[0],
      end: new Date("<2000-01-01>").toISOString().split("T")[0],
      salary: 50000,
      commited: false,
    },
    {
      _id: db.ObjectId("aaaf9854aabcf8eda55e49ff"),
      project: db.ObjectId("61af9854aabcf8eda55e49aa"),
      executor: db.ObjectId("618beab56b0df02e94319c18"),
      name: "contract 2",
      start: new Date("<2000-04-18>").toISOString().split("T")[0],
      end: new Date("<2003-03-04>").toISOString().split("T")[0],
      salary: 60000,
      commited: false,
    },
  ],

  initialize: function () {
    db.persons.count(function (err, n) {
      if (n == 0) {
        console.log("No persons, example data will be used");
        example.persons.forEach(function (person) {
          db.persons.insertOne(person, function (err, result) {});
          console.log("db.persons.insertOne(" + JSON.stringify(person) + ")");
        });
      }
    });
    db.users.count(function (err, n) {
      if (n == 0) {
        console.log("No users, example data will be used");
        example.users.forEach(function (user) {
          db.users.insertOne(user, function (err, result) {});
          console.log("db.users.insertOne(" + JSON.stringify(user) + ")");
        });
      }
    });

    db.projects.count(function (err, n) {
      if (n == 0) {
        console.log("No projects, example data will be used");
        example.projects.forEach(function (project) {
          db.projects.insertOne(project, function (err, result) {});
          console.log("db.projects.insertOne(" + JSON.stringify(project) + ")");
        });
      }
    });

    db.contracts.count(function (err, n) {
      if (n == 0) {
        console.log("No contracts, example data will be used");
        example.contracts.forEach(function (contract) {
          db.contracts.insertOne(contract, function (err, result) {});
          console.log(
            "db.contracts.insertOne(" + JSON.stringify(contract) + ")"
          );
        });
      }
    });
  },
});
