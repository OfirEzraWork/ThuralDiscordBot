const JsonTable = require("../jsonTable");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const characterByIDTable = new JsonTable(process.env.CHARACTERBYIDTABLEPATH);
characterByIDTable.ReadTable();
exports.characterExists = function (characterID) {
  if (characterByIDTable.Read(characterID) !== undefined) {
    return true;
  }
  return false;
};

exports.characterBelongsToPlayer = function (playerID, characterID) {
  if (characterByIDTable.Read(characterID).PlayerID === playerID) {
    return true;
  }
  return false;
};

exports.addCharacterByID = function (characterID, characterName, playerID) {
  characterByIDTable.Write(characterID, {
    CharacterName: characterName,
    PlayerID: playerID,
  });
  characterByIDTable.UpdateTable();
};

exports.getACharacterPlayer = function (characterID) {
  return characterByIDTable.Read(characterID).PlayerID;
};
