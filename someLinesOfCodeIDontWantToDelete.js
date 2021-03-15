const discord = require("discord.js");

const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_CONNECTION_STRING;
const mongoClient = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const JsonTable = require("./jsonTable");

const DBPaths = {
  gamesTablePath: "databases/games.json",
  countersTablePath: "databases/counters.json",
  charactersTablePath: "databases/characters.json",
  characterByIDTablePath: "databases/characterByID.json",
  transactionsTablePath: "databases/transactions.json",
  permissionsTablePath: "databases/permissions.json",
};