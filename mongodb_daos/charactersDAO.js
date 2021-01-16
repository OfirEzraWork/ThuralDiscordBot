const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_CONNECTION_STRING;
const DBName = process.env.DB_NAME;

//get functions
exports.getPlayerCharacterList = async function (playerID) {
  return await getPlayerCharacterList(playerID);
};
async function getPlayerCharacterList(playerID) {
  const mongoClient = getMongoDBClient();
  let returnValue;
  try {
    await mongoClient.connect();
    let result = await mongoClient
      .db(DBName)
      .collection("characters")
      .findOne({ PlayerID: playerID });
    returnValue = result.Characters;
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

exports.getActiveCharacter = async function (playerID) {
  return await getActiveCharacter(playerID);
};
async function getActiveCharacter(playerID) {
  const characterList = await getPlayerCharacterList(playerID);
  const character = characterList.find((char) => {
    if (char.ActiveCharacter === true) {
      return char;
    }
  });
  if (character === undefined) {
    return null;
  }
  return character;
}

exports.getCharacterGold = async function (playerID, characterID) {
  return await getCharacterGold(playerID, characterID);
};
async function getCharacterGold(playerID, characterID) {
  const characterList = await getPlayerCharacterList(playerID);
  const character = characterList.find((char) => {
    if (char.CharacterID === Number(characterID)) {
      return char;
    }
  });
  if (character === undefined) {
    return null;
  }
  return character.Gold;
}

//update functions
exports.addGoldToCharacter = async function (playerID, characterID, gold) {
  const mongoClient = getMongoDBClient();
  try {
    const newGold =
      (await getCharacterGold(playerID, characterID)) + Number(gold);

    characterID = Number(characterID);
    await mongoClient.connect();
    const result = await mongoClient
      .db(DBName)
      .collection("characters")
      .updateOne(
        { PlayerID: playerID, "Characters.CharacterID": characterID },
        { $set: { "Characters.$.Gold": newGold } }
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
    console.log(characterList);
    characterList.push({
      CharacterName: characterName,
      Gold: 0,
      CharacterID: newCharacterID,
      ActiveCharacter: isActiveCharacter,
    });
    console.log(characterList);
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
        char.CharacterID === oldActiveCharacter ||
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
