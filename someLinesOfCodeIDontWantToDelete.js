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

async function characterBelongsToPlayer(playerID, characterID) {
  const mongoClient = getMongoDBClient();
  let returnValue;
    try {
      await mongoClient.connect();
      let result = await mongoClient
        .db(DBName)
        .collection("characters")
        .findOne({ PlayerID: playerID , 'Characters.CharacterID': Number(characterID)});
      if(!result) {
        returnValue = null;
      } else {
        returnValue = result.Characters;
      }
      
    } catch (e) {
      console.error(e);
    } finally {
      await mongoClient.close();
      if (returnValue == undefined) {
        return null;
      }
      return returnValue;
    }
  }