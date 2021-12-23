const charactersDAO = require("../../mongodb_daos/charactersDAO.js");
const transactionsDAO = require("../../mongodb_daos/transactionsDAO");
const countersDAO = require("../../json_daos/countersDAO.js");
const permissionsDAO = require("../../json_daos/permissionsDAO.js");

//Gold Status
const getGoldStatusStringBuilder = async function (playerID) {
  let status = "";
  const playerCharacters = await charactersDAO.getPlayerCharacterList(playerID);
  playerCharacters.forEach((character) => {
    status += `${character.CharacterName} (`;
    if (character.ActiveCharacter === true) {
      status += `Active, `;
    }
    status += `ID = ${character.CharacterID}): ${character.Gold} gp\n`;
  });
  return status;
};

//Give Gold Functions
const goldTransaction = async function (
  playerGiverID,
  characterGiverID,
  playerReceiverID,
  characterReceiverID,
  gold
) {
  //reduce from giver
  await charactersDAO.addGoldToCharacter(
    playerGiverID,
    characterGiverID,
    -gold
  );

  //increase receiver
  await charactersDAO.addGoldToCharacter(
    playerReceiverID,
    characterReceiverID,
    gold
  );

  //record the transaction in the transactions json
  transactionsDAO.writeTransaction(characterGiverID, characterReceiverID, gold);

  countersDAO.increaseCounter("transactions");
};

const goldChecks = async function (checksNeeded, playerGiverID, variables) {
  const result = {
    checksOut: true,
    response: null,
  };

  let characterGiverID;
  let characterReceiverID;
  let gold;

  //check for valid input string
  if (checksNeeded.varsLengthCheck) {
    if (variables.split(" ").length < checksNeeded.varsLengthCheck) {
      result.checksOut = false;
      result.response =
        "Stop with this Jibber Jabber!\nYou dont make sense!\nBad Command";
      return result;
    } else if (checksNeeded.varsLengthCheck == 2) {
      characterReceiverID = variables.split(" ")[0];
    }
    gold = variables.split(" ")[checksNeeded.varsLengthCheck - 1];
  }

  //check admin priviliges
  if (checksNeeded.hasAdminPriviliges) {
    if (!(await permissionsDAO.userHasAdminRights(playerGiverID))) {
      result.checksOut = false;
      result.response = "You are not powerful enough to use this command!\n";
      return result;
    }
  }

  //player doesn't have any characters
  if (checksNeeded.playerHasCharacters) {
    //get a player active character
    characterGiverID = (await charactersDAO.getActiveCharacter(playerGiverID))
      .CharacterID;

    if (characterGiverID === undefined) {
      result.checksOut = false;
      result.response =
        "You don't seem to represent any known individual!\nNo active character found";
      return result;
    }
  }

  //giving gold to yourself
  if (checksNeeded.selfGiver) {
    if (characterGiverID == characterReceiverID) {
      result.checksOut = false;
      result.response =
        "Giving gold to yourself even though its possible is just stupid.\nTransaction Successful?";
      return result;
    }
  }

  //giving negative gold
  if (checksNeeded.negativeGold) {
    if (Number(gold) < 0) {
      result.checksOut = false;
      result.response = "You think you can outwit me, fool!?\nNice try...";
      return result;
    }
  }

  //check if character exists
  if (checksNeeded.characterReceiverExists) {
    if (!(await charactersDAO.characterExist(characterReceiverID))) {
      result.checksOut = false;
      result.response =
        "I was'nt able to find that PersonBeastOoze entity!\nCharacter not found";
      return result;
    }
  }

  //the Giver character does not have enough gold
  if (checksNeeded.enoughGold) {
    if (!(charactersDAO.getCharacterGold(characterGiverID) >= gold)) {
      result.checksOut = false;
      result.response =
        "Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n";
      return result;
    }
  }

  if (checksNeeded.playerHasCharacters) {
    result.characterGiverID = characterGiverID;
  }
  if (checksNeeded.varsLengthCheck) {
    result.characterReceiverID = characterReceiverID;
    result.gold = gold;
  }

  return result;
};

exports.goldStatus = async function (playerID, embed) {
  const goldStatus = await getGoldStatusStringBuilder(playerID);
  if (goldStatus === "") {
    embed.embedNeeded = false;
    return "It seems that you dont have any characters.\nA shame really, guess ill have to find treasure elsewhere.\n* Flies away *\nNo characters associated to this user.";
  }
  embed.embedNeeded = true;
  embed.color = 2123412;
  embed.title = "Gold Status";
  embed.thumbnail = "assets/dm.jpg";

  return goldStatus;
};

exports.giveGold = async function (playerGiverID, variables) {
  const checksNeeded = {
    varsLengthCheck: 2,
    playerHasCharacters: true,
    selfGiver: true,
    negativeGold: true,
    characterReceiverExists: true,
    enoughGold: true,
  };
  const result = await goldChecks(checksNeeded, playerGiverID, variables);

  if (result.checksOut) {
    const playerReceiverID = await charactersDAO.getACharacterPlayer(
      result.characterReceiverID
    );

    goldTransaction(
      playerGiverID,
      result.characterGiverID,
      playerReceiverID,
      result.characterReceiverID,
      Number(result.gold)
    );

    result.response = "Transaction Successful!";
  }

  return result.response;
};

exports.adminGiveGold = async function (playerGiverID, variables) {
  const checksNeeded = {
    varsLengthCheck: 2,
    hasAdminPriviliges: true,
    playerHasCharacters: true,
    characterReceiverExists: true,
  };
  const result = await goldChecks(checksNeeded, playerGiverID, variables);

  if (result.checksOut) {
    const playerReceiverID = await charactersDAO.getACharacterPlayer(
      result.characterReceiverID
    );

    await charactersDAO.addGoldToCharacter(
      playerReceiverID,
      result.characterReceiverID,
      Number(result.gold)
    );

    await transactionsDAO.writeTransaction(
      "Admin",
      result.characterReceiverID,
      Number(result.gold)
    );

    await countersDAO.increaseCounter("transactions");

    result.response = "The gold was delievered to the character!\n";
  }

  return result.response;
};

exports.pay = async function (playerGiverID, variables) {
  const checksNeeded = {
    varsLengthCheck: 1,
    playerHasCharacters: true,
    negativeGold: true,
    enoughGold: true,
  };

  const result = await goldChecks(checksNeeded, playerGiverID, variables);

  if (result.checksOut) {
    await charactersDAO.addGoldToCharacter(
      playerGiverID,
      result.characterGiverID,
      -Number(result.gold)
    );

    result.response = "Transaction Successful!";
  }

  return result.response;
};
