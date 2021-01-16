const JsonTable = require("../jsonTable");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const charactersTable = new JsonTable(process.env.CHARACTERSTABLEPATH);
charactersTable.ReadTable();
exports.playerCharacterListExists = function (playerID) {
  if (charactersTable.Read(playerID) !== undefined) {
    return true;
  }
  return false;
};
exports.addGoldToCharacter = function (playerID, characterID, gold) {
  const characterList = charactersTable.Read(playerID).Characters;
  const characterToGiveGoldTo = characterList.find((character) => {
    if (character.CharacterID === Number(characterID)) {
      return character;
    }
  });
  characterToGiveGoldTo.Gold += Number(gold);
  charactersTable.UpdateTable();
};
exports.getPlayerCharacterList = function (playerID) {
  return charactersTable.Read(playerID).Characters;
};
exports.createCharacterList = function (playerID, playerUserName) {
  charactersTable.Write(playerID, {
    Creator: playerUserName,
    Characters: [],
  });
};
exports.writeNewCharacter = function (
  playerID,
  characterName,
  newCharacterID,
  isActiveCharacter
) {
  charactersTable.Read(playerID).Characters.push({
    CharacterName: characterName,
    Gold: 0,
    CharacterID: newCharacterID,
    ActiveCharacter: isActiveCharacter,
  });
  charactersTable.UpdateTable();
};
exports.getActiveCharacter = function (playerID) {
  const characterList = charactersTable.Read(playerID).Characters;
  const activeCharacter = characterList.find((character) => {
    if (character.ActiveCharacter === true) {
      return character;
    }
  });
  return activeCharacter;
};
exports.changeActiveCharacter = function (
  playerID,
  oldActiveCharacter,
  newActiveCharacter
) {
  const characterList = charactersTable.Read(playerID).Characters;
  characterList.forEach((character) => {
    if (
      character.CharacterID === oldActiveCharacter ||
      character.CharacterID === Number(newActiveCharacter)
    ) {
      character.ActiveCharacter = !character.ActiveCharacter;
    }
  });
  charactersTable.UpdateTable();
};
exports.getCharacterGold = function (playerID, characterID) {
  const characterList = charactersTable.Read(playerID).Characters;
  const characterGold = characterList.find((character) => {
    if (character.CharacterID === characterID) return character;
  });
  return characterGold.Gold;
};
