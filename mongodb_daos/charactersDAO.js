const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_CONNECTION_STRING;
const DBName = process.env.DB_NAME;

//get functions
async function getPlayerByCharacterID(characterID) {
  const mongoClient = getMongoDBClient();
  let result;
    try {
      await mongoClient.connect();
      result = await mongoClient
        .db(DBName)
        .collection("characters")
        .findOne({'Characters.CharacterID': Number(characterID)});
    } catch (e) {
      console.error(e);
    } finally {
      await mongoClient.close();
      return result;
    }
};
async function getPlayerByPlayerID(playerID) {
  const mongoClient = getMongoDBClient();
  let result;
  try {
    await mongoClient.connect();
    result = await mongoClient
      .db(DBName)
      .collection("characters")
      .findOne({ PlayerID: playerID });
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
    return result;
  }
};
async function getCharacter(characterID) {
  const player = await getPlayerByCharacterID(characterID);
  if(player){
    return player.Characters.find((char) => {
      return char.CharacterID == Number(characterID);
    });
  }
  return null;
};
async function getPlayerCharacterList(playerID){
  return (await getPlayerByPlayerID(playerID)).Characters;
};

exports.characterExist = async function (characterID) {
  return await getCharacter(characterID);
};
exports.getACharacterPlayer = async function (characterID) {
  const char = await getPlayerByCharacterID(characterID);
  if(char){
    return char.PlayerID;
  }
  return false;
};
exports.getCharacterGold = async function (characterID) {
  const character = await getCharacter(characterID);
  if (character) {
    return character.Gold;
  }
  return null;
};
exports.getActiveCharacter = async function (playerID) {
  const characters = await getPlayerCharacterList(playerID);
  if(characters){
    const character = characters.find((char) => {
      if (char.ActiveCharacter === true) {
        return char;
      }
    });
    if (character) {
      return character;
    }
  }
  return null;
};
exports.getPlayerCharacterList = async function (playerID) {
  return await getPlayerCharacterList(playerID);
};
exports.characterBelongsToPlayer = async function (playerID, characterID) {
  const player = await getPlayerByCharacterID(characterID);
  if(player && player.PlayerID == playerID) {
    return true;
  }
  return false;
};

//update functions
exports.addGoldToCharacter = async function (playerID, characterID, gold) {
  const mongoClient = getMongoDBClient();
  try {
    characterID = Number(characterID);
    await mongoClient.connect();
    await mongoClient
      .db(DBName)
      .collection("characters")
      .updateOne(
        { PlayerID: playerID, "Characters.CharacterID": characterID },
        { $inc: { "Characters.$.Gold": Number(gold) } }
      );
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
  }
};
exports.createCharacterList = async function (playerID, playerUserName) {
  const mongoClient = getMongoDBClient();
  try {
    await mongoClient.connect();
    const result = await mongoClient
      .db(DBName)
      .collection("characters")
      .insertOne({
        PlayerID: playerID,
        Creator: playerUserName,
        Characters: [],
      });
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
  }
};
exports.writeNewCharacter = async function (
  playerID,
  characterName,
  newCharacterID,
  isActiveCharacter
) {
  const mongoClient = getMongoDBClient();
  try {
    const characterList = await getPlayerCharacterList(playerID);
    characterList.push({
      CharacterName: characterName,
      Gold: 0,
      CharacterID: newCharacterID,
      ActiveCharacter: isActiveCharacter,
    });
    newCharacterID = Number(newCharacterID);
    await mongoClient.connect();
    const result = await mongoClient
      .db(DBName)
      .collection("characters")
      .updateOne(
        { PlayerID: playerID },
        { $set: { Characters: characterList } }
      );
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
  }
};
exports.changeActiveCharacter = async function (
  playerID,
  oldActiveCharacter,
  newActiveCharacter
) {
  const mongoClient = getMongoDBClient();
  try {
    const characterList = await getPlayerCharacterList(playerID);
    characterList.forEach((char) => {
      if (
        char.CharacterID === Number(oldActiveCharacter) ||
        char.CharacterID === Number(newActiveCharacter)
      ) {
        char.ActiveCharacter = !char.ActiveCharacter;
      }
    });

    await mongoClient.connect();
    result = await mongoClient
      .db(DBName)
      .collection("characters")
      .updateOne(
        { PlayerID: playerID },
        { $set: { Characters: characterList } }
      );
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
  }
};

//other functions
function getMongoDBClient() {
  return new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}