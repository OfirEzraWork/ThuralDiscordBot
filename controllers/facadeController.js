const { XMLHttpRequest } = require("xmlhttprequest");

const messageController = require("./messageController.js");

const JsonReader = require("../server/jsonReader.js");

//JsonTable and DBPaths are required for the gamesDAO. Remove when moving gamesDAO to a different file.
const DBPaths = {
  gamesTablePath: "databases/games.json",
  countersTablePath: "databases/counters.json",
  charactersTablePath: "databases/characters.json",
  characterByIDTablePath: "databases/characterByID.json",
  transactionsTablePath: "databases/transactions.json",
  permissionsTablePath: "databases/permissions.json",
};

const WMSTable = new JsonReader("lists/wild-magic-surge-table.json");

//Old and bad
const JsonTable = require("../jsonTable");
const gamesDAO = (function () {
  const gamesTable = new JsonTable(DBPaths.gamesTablePath);
  gamesTable.ReadTable();
  return {
    playerIsGameCreator: function (playerID, gameID) {
      if (gamesTable.Read(gameID).CreatorID == playerID) {
        return true;
      }
      return false;
    },
    gameIsFullyBooked: function (gameID) {
      const game = gamesTable.Read(gameID);
      if (game.Players.length == game.MaxPlayers) {
        return true;
      }
      return false;
    },
    getAGamePlayersList: function (gameID) {
      return gamesTable.Read(gameID).Players;
    },
    createAGame: function (newGameID, playerUserName, playerID) {
      gamesTable.Write(newGameID, {
        Creator: playerUserName,
        CreatorID: playerID,
        Active: true,
        Players: [],
        Date: null,
        Description: "",
      });
      gamesTable.UpdateTable();
    },
    getGame: function (gameID) {
      return gamesTable.Read(gameID);
    },
    setGame: function (gameID, game) {
      gamesTable.Write(gameID, game);
      gamesTable.UpdateTable();
    },
    playerHasSignedUp: function (playerID, gameID) {
      let result = false;
      gamesDAO.getAGamePlayersList(gameID).forEach((player) => {
        if (player.PlayerID === playerID) {
          result = true;
        }
      });
      return result;
    },
    getActiveGames: function () {
      return gamesTable.ReadAllWhere("Active", true);
    },
  };
})();
const countersDAO = require("../json_daos/countersDAO.js");
const characterByIDDAO = require("../json_daos/characterByIDDAO.js");
const transactionsDAO = require("../json_daos/transactionDAO");
const permissionsDAO = require("../json_daos/permissionsDAO.js");

//New and good
const charactersDAO = require("../mongodb_daos/charactersDAO.js");
const goldFunctions = require("./functions/goldFunctions.js");

let prefix = process.env.PREFIX;

//Help
const help = function (embed) {
  embed["embedNeeded"] = true;
  embed["color"] = 7419530;
  embed["title"] = "Help";
  embed["thumbnail"] = "assets/Thural.jpg";
  return (
    "I usually dont take commands from the likes of you but for now ill make an exception.\n" +
    "The commands are:\n\n" +
    "Dice:\n" +
    "Dice Rolls - " +
    prefix +
    "roll [Number]d[Number]+[Number]\n" +
    "\n" +
    "Game Material:\n" +
    "Searching for a spell (Only SRD) - " +
    prefix +
    "spell [Name]\n" +
    "\n" +
    "Game Managing:\n" +
    "Create a new game - " +
    prefix +
    "creategame\n" +
    "Set a game date - " +
    prefix +
    "setgamedate [GameNumber] [Date]\n" +
    "Set a game description - " +
    prefix +
    "setgamedesc [GameNumber] [Description]\n" +
    "Show active games - " +
    prefix +
    "showgames\n" +
    "Show game - " +
    prefix +
    "showgame [GameNumber]\n" +
    "Sign up to a game (A) - " +
    prefix +
    "signup [GameNumber]\n" +
    "Close game - " +
    prefix +
    "closegame [GameNumber]\n" +
    "\n" +
    "Gold Trade:\n" +
    "Register a character - " +
    prefix +
    "rc [CharacterName]\n" +
    "View your characters gold status - " +
    prefix +
    "gs\n" +
    "Change active character - " +
    prefix +
    "active [CharacterID]\n" +
    "Make a payment (A) - " +
    prefix +
    "pay [Amount]\n" +
    "Transfer gold to another character (A) - " +
    prefix +
    "gg [ReceivingCharacterID] [Amount]\n" +
    "\n" +
    "Commands marked with (A) uses your current active character."
  );
};

//Rolls
function rollTheDice(rollAmount, rollDie, modifiers) {
  console.log(`${rollAmount} ${rollDie} ${modifiers}`);
  const values = {
    rolls: [],
    modifiers: 0,
    sum: 0,
  };
  for (let i = 0; i < parseInt(rollAmount); i++) {
    let roll = Math.floor(Math.random() * parseInt(rollDie)) + 1;
    values.sum = values.sum + roll;
    values.rolls.push(roll);
  }
  if (modifiers) {
    modifiers.forEach((element) => {
      values.modifiers = values.modifiers + parseInt(element);
      values.sum = values.sum + parseInt(element);
    });
  }
  return values;
}

const commandRoll = function (str) {
  let messageRegex = new RegExp("([0-9]+)d([0-9]+)(\\+([0-9]+))*", "g");
  let messageRegexResult = str.toLowerCase().match(messageRegex);
  if (
    messageRegexResult != null &&
    messageRegexResult[0] === str.toLowerCase()
  ) {
    let diceRollRegex = new RegExp("([0-9]+)d([0-9]+)");
    let diceRollRegexResult = str.toLowerCase().match(diceRollRegex);
    let modifiersRegex = new RegExp("((?<=\\+)[0-9]+)+", "g");
    let modifiersRegexResult = str.toLowerCase().match(modifiersRegex);

    const values = rollTheDice(
      diceRollRegexResult[1],
      diceRollRegexResult[2],
      modifiersRegexResult
    );

    return values;
  } else {
    return null;
  }
};

const commandRollStringBuilder = function (result) {
  if (result !== null) {
    console.log(result);
    let returnMessage = `Total: ${result.sum}\n`;
    result.rolls.forEach((element) => {
      returnMessage = returnMessage + `${element}, `;
    });
    returnMessage = returnMessage.substring(0, returnMessage.length - 2);
    returnMessage = returnMessage + `\nWith a +${result.modifiers} modifier`;
    return returnMessage;
  } else {
    return "You roll dice wrong.\nFoolish Human!";
  }
};
const roll = function (variables) {
  return commandRollStringBuilder(commandRoll(variables));
};
function fetchWildMagicSurgeDescription(number) {}
function commandWMSStringBuilder(result, description) {
  console.log(result);
  let returnMessage = `You Rolled: ${result.sum}\n`;
  returnMessage = returnMessage + `${description.result}`;
  return returnMessage;
}

function wildMagicSurge(variables) {
  if (!variables) {
    const result = rollTheDice(1, 100);
    const description = WMSTable.Read(Math.ceil(result.sum / 2));
    return commandWMSStringBuilder(result, description);
  } else if (
    Number(variables) &&
    Number(variables) >= 1 &&
    Number(variables) <= 100
  ) {
    return WMSTable.Read(Math.ceil(variables / 2)).result;
  } else {
    return "Wild Magic Surge roll wasn't found";
  }
}

//Spells
const getSpellHttpRequest = function (str) {
  return new Promise(function (resolve, reject) {
    let request = new XMLHttpRequest();
    request.open("GET", `http://www.dnd5eapi.co/api/spells/${str}`);
    request.onload = function () {
      if (this.readyState === 4 && this.status === 200) {
        let response = JSON.parse(this.responseText);
        resolve(response);
      } else {
        resolve(null);
      }
    };
    request.send();
  });
};

const getSpellStringBuilder = async function (result) {
  if (result !== null) {
    let returnMessage = `${result.name}\n`;

    //Level, School, Ritual
    returnMessage =
      returnMessage + `Level ${result.level} ${result.school.name}`;
    if (result.ritual) {
      returnMessage = returnMessage.concat(` (ritual)`);
    }
    returnMessage = returnMessage.concat(`\n`);

    returnMessage = returnMessage + `Casting Time: ${result.casting_time}\n`;
    returnMessage = returnMessage + `Range: ${result.range}\n`;
    //End Level, School, Ritual

    //Components
    returnMessage = returnMessage + `Components: `;
    result.components.forEach((element) => {
      returnMessage = returnMessage + `${element},`;
    });
    returnMessage = returnMessage.slice(0, returnMessage.length - 1);
    if ((result.material !== "") & (result.material !== undefined)) {
      returnMessage = returnMessage + ` (${result.material})`;
    }
    returnMessage = returnMessage.concat(`\n`);

    //End components

    //Duration
    if (result.concentration === true) {
      returnMessage =
        returnMessage + `Duration: Concentration, ${result.duration}`;
    } else {
      returnMessage = returnMessage + `Duration: ${result.duration}`;
    }
    returnMessage = returnMessage + `\n`;
    //End duration

    //Description
    result.desc.forEach((element) => {
      returnMessage = returnMessage + `${element}\n`;
    });
    if (result.higher_level !== undefined) {
      result.higher_level.forEach((element) => {
        returnMessage = returnMessage + `${element}\n`;
      });
    }
    //End description

    return returnMessage;
  } else {
    return "Spell wasn't found";
  }
};
const getSpell = async function (variables) {
  const result = await getSpellHttpRequest(variables.replace(" ", "-"));
  return getSpellStringBuilder(result);
};
/**********************************************************************************************/
//
//
//                                   Equipment Functions
//
//
/**********************************************************************************************/

const getAllRelevantEquipmentStringBuilder = function (result, requestData) {
  const response = [];
  let data = requestData.equipmentTitle;
  if (requestData.magicItem) {
    result.results.forEach((equipment) => {
      let nextData = equipment.name + " (" + equipment.index + ")\n\n";
      if (nextData.length > 1980) {
        return "ERROR! Body exceeds possible message length";
      } else if (data.length + nextData.length >= 1980) {
        response.push(data);
        data = nextData;
      } else {
        data += nextData;
      }
    });
  } else {
    result.equipment.forEach((equipment) => {
      let nextData = "";
      if (equipment.url.startsWith("/api/equipment")) {
        nextData = equipment.name + " (" + equipment.index + ")\n\n";
        if (nextData.length > 1980) {
          return "ERROR! Body exceeds possible message length";
        } else if (data.length + nextData.length >= 1980) {
          response.push(data);
          data = nextData;
        } else {
          data += nextData;
        }
      }
    });
  }

  response.push(data);

  if (response.length == 1) {
    return response[0];
  } else {
    for (let i = 0; i < response.length; i++) {
      response[i] += "Message " + (i + 1) + "/" + response.length;
    }
  }
  return response;
};

const getAllRelevantEquipmentHttpRequest = function (str) {
  return new Promise(function (resolve, reject) {
    let request = new XMLHttpRequest();
    request.open("GET", str);
    request.onload = function () {
      if (this.readyState === 4 && this.status === 200) {
        let response = JSON.parse(this.responseText);
        resolve(response);
      } else {
        resolve(null);
      }
    };
    request.send();
  });
};

const getAllRelevantEquipment = async function (equipmentType) {
  const requestData = {
    equipmentUrl: "http://www.dnd5eapi.co/api/equipment-categories/",
    magicItemUrl: "http://www.dnd5eapi.co/api/magic-items/",
    magicItem: false,
  };
  if (equipmentType == "armors") {
    requestData.equipmentUrl = requestData.equipmentUrl + "armor";
    requestData.equipmentTitle = "Types of armor: \n";
  } else if (equipmentType == "weapons") {
    requestData.equipmentUrl = requestData.equipmentUrl + "weapon";
    requestData.equipmentTitle = "Types of weapons: \n";
  } else if (equipmentType == "ag") {
    requestData.equipmentUrl = requestData.equipmentUrl + "adventuring-gear";
    requestData.equipmentTitle = "Adventuring Gear: \n";
  } else if (equipmentType == "mi") {
    // equipmentType == "weapon";
    requestData.magicItem = true;
    requestData.equipmentTitle = "Magical Items: \n";
  }
  if (requestData.magicItem) {
    return getAllRelevantEquipmentStringBuilder(
      await getAllRelevantEquipmentHttpRequest(requestData.magicItemUrl),
      requestData
    );
  } else {
    return getAllRelevantEquipmentStringBuilder(
      await getAllRelevantEquipmentHttpRequest(requestData.equipmentUrl),
      requestData
    );
  }
};

//Register Character
const registerCharacter = async function (playerID, playerUserName, variables) {
  const characterCounterString = "characterCounter";

  //gather information
  const characterName = variables.charAt(0).toUpperCase() + variables.slice(1);
  const newCharacterID = countersDAO.getCounter(characterCounterString);

  let firstCharacter = false;

  //build a new player character list
  console.log("im here");
  if (!(await charactersDAO.getPlayer(playerID))) {
    console.log("im not here");
    await charactersDAO.createCharacterList(playerID, playerUserName);
    firstCharacter = true;
  }

  //push the new character into the player characters list
  await charactersDAO.writeNewCharacter(
    playerID,
    characterName,
    newCharacterID,
    firstCharacter
  );

  //push the new character into the characterByID table
  characterByIDDAO.addCharacterByID(newCharacterID, characterName, playerID);

  //updating tables
  countersDAO.increaseCounter(characterCounterString);

  return `Its good meeting you ${characterName}! Your number is ${newCharacterID}`;
};

//Active Character
const setActiveCharacter = async function (playerID, variables) {
  const newCharacterID = variables.split(" ")[0];
  if (await charactersDAO.characterBelongsToPlayer(playerID, newCharacterID)) {
    const activeCharacterID = (await charactersDAO.getActiveCharacter(playerID))
      .CharacterID;
    if (activeCharacterID === Number(newCharacterID)) {
      return "This character is already your active character.";
    } else {
      charactersDAO.changeActiveCharacter(
        playerID,
        activeCharacterID,
        newCharacterID
      );
      return `Success! new character ID is: ${newCharacterID}`;
    }
  }
  return `Character not found or it doesn't belong to you`;
};

/**********************************************************************************************/
//
//
//                                  Game Managing Functions
//
//
/**********************************************************************************************/

const createANewGame = async function (playerUserName, playerID) {
  const newGameID = countersDAO.getCounter("gameCounter");
  gamesDAO.createAGame(newGameID, playerUserName, playerID);
  countersDAO.increaseCounter("gameCounter");
  return `The quest has been declared!\nNow gather worthy adventurers to aid you.\nGame number is: ${newGameID}`;
};

const gameChecks = async function (checksNeeded, playerID, gameID, variables) {
  const result = {
    checksOut: true,
    response: null,
    game: null,
  };

  //check for valid input string
  if (checksNeeded.varsLengthCheck.needed) {
    if (
      variables.split(" ").length < checksNeeded.varsLengthCheck.length ||
      isNaN(gameID)
    ) {
      result.checksOut = false;
      result.response =
        "Stop with this Jibber Jabber!\nYou dont make sense!\nBad Command";
      return result;
    }
  }

  //check if game exists
  const game = gamesDAO.getGame(gameID);
  if (checksNeeded.gameExistsCheck) {
    if (game === undefined) {
      result.checksOut = false;
      result.response =
        "This quest does not exist.\nDont waste my time with this annoyances!";
      return result;
    }
  }

  //check if editing player is game creator
  if (checksNeeded.playerIsGameCreatorCheck) {
    if (game.CreatorID != playerID) {
      result.checksOut = false;
      result.response = "You are not the one in charge of this quest!";
      return result;
    }
  }

  //check if the game is still active
  if (checksNeeded.gameIsActive) {
    if (!game.Active) {
      result.checksOut = false;
      result.response =
        "That quest happend long ago.\nI think they died in that one.";
      return result;
    }
  }

  //check if a player has already signed to a game
  if (checksNeeded.playerIsAlreadySignedUpCheck) {
    if (gamesDAO.playerHasSignedUp(playerID, gameID)) {
      result.checksOut = false;
      result.response = "You have already enlisted to this quest!";
      return result;
    }
  }

  //check if a game is fully booked
  if (checksNeeded.gameIsFullyBookedCheck) {
    if (gamesDAO.gameIsFullyBooked(gameID)) {
      result.checksOut = false;
      result.response =
        "Ugh! The road is not wide enough for all of you!\nYou'll have to sit this one out im afraid...\nGame is fully booked";
      return result;
    }
  }

  result.game = game;
  return result;
};

const setGameDate = async function (playerID, variables) {
  const gameID = variables.split(" ")[0];
  const date = variables.split(" ").slice(1).join(" ");
  const checksNeeded = {
    varsLengthCheck: {
      needed: true,
      length: 2,
    },
    gameExistsCheck: true,
    playerIsGameCreatorCheck: true,
    gameIsActive: true,
  };
  const result = gameChecks(checksNeeded, playerID, gameID, variables);

  if (result.checksOut) {
    result.game.Date = date;
    gamesDAO.setGame(gameID, result.game);
    return "We will march forward in " + date + ".\nDate update Successful.";
  } else {
    return result.response;
  }
};

const setGameDesc = async function (playerID, variables) {
  const gameID = variables.split(" ")[0];
  const desc = variables.split(" ").slice(1).join(" ");
  const checksNeeded = {
    varsLengthCheck: {
      needed: true,
      length: 2,
    },
    gameExistsCheck: true,
    playerIsGameCreatorCheck: true,
    gameIsActive: true,
  };
  const result = gameChecks(checksNeeded, playerID, gameID, variables);

  if (result.checksOut) {
    result.game.Description = desc;
    gamesDAO.setGame(gameID, result.game);
    return "Good plan!\nHope you wont burn in lava.\nDescription update Successful.";
  } else {
    return result.response;
  }
};

const signUp = async function (playerUserName, playerID, variables) {
  const gameID = variables.split(" ")[0];
  const checksNeeded = {
    varsLengthCheck: {
      needed: true,
      length: 1,
    },
    gameExistsCheck: true,
    gameIsActive: true,
    playerIsAlreadySignedUpCheck: true,
    gameIsFullyBookedCheck: true,
  };
  const character = charactersDAO.getActiveCharacter(playerID);
  const result = gameChecks(checksNeeded, playerID, gameID, variables);

  if (result.checksOut) {
    result.game.Players.push({
      PlayerUsername: playerUserName,
      PlayerID: playerID,
      CharacterID: character.CharacterID,
      CharacterName: character.CharacterName,
    });
    gamesDAO.setGame(gameID, result.game);
    return "Prepare your weapon and don your armor.\nThis will be a tough one.\nSignup Successful.";
  } else {
    return result.response;
  }
};

const showActiveGames = async function () {
  let gamesString = "";
  const activeGames = gamesDAO.getActiveGames();
  for (let index in activeGames) {
    gamesString +=
      "Game Number: " +
      index +
      "\nCreator: " +
      activeGames[index].Creator +
      "\nDate: " +
      activeGames[index].Date +
      "\nDescription: " +
      activeGames[index].Description;
    if (activeGames[index].Players.length > 0) {
      gamesString += "\nPlayers:";
      activeGames[index].Players.forEach((player) => {
        gamesString += "\n\t" + player.CharacterName;
      });
    }
    gamesString += "\n\n";
  }
  return gamesString;
};

/**********************************************************************************************/
//
//
//                                  Main Facade Function
//
//
/**********************************************************************************************/

const testFunction1 = async function () {
  await charactersDAO.characterExist(11);
};
exports.IncomingMessage = async function (message) {
  const processedMessage = messageController.ProcessMessage(message);
  if (processedMessage.workNeeded) {
    await DoWork(processedMessage);
  }
  if (processedMessage.responseNeeded) {
    let response;
    if (
      Array.isArray(processedMessage.response) &&
      processedMessage.editedResponseNeeded
    ) {
      response = processedMessage.response.slice(
        1,
        processedMessage.response.length
      );
    } else {
      response = processedMessage.response;
    }
    messageController.SendMessage(
      processedMessage.channel,
      response,
      processedMessage.embed
    );
  }
  if (processedMessage.editedResponseNeeded) {
    let response;
    if (Array.isArray(processedMessage.response)) {
      response = processedMessage.response[0];
    } else {
      response = processedMessage.response;
    }
    messageController.EditMessage(processedMessage.responseToEdit, response);
  }
};

const DoWork = async function (processedMessage) {
  processedMessage.responseNeeded = true;
  const { command: cmd } = processedMessage.parsedMessage;
  if (cmd === "test") {
    processedMessage.response = await testFunction1();
    processedMessage.responseNeeded = false;
  } else if (cmd === "help") {
    processedMessage.response = help(processedMessage.embed);
  } else if (cmd === "roll") {
    processedMessage.response = roll(processedMessage.parsedMessage.variables);
  } else if (cmd === "wms") {
    processedMessage.response = wildMagicSurge(
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "spell") {
    processedMessage.responseToEdit = await messageController.SendMessage(
      processedMessage.channel,
      "Searching the great library...",
      processedMessage.embed
    );
    processedMessage.response = await getSpell(
      processedMessage.parsedMessage.variables
    );
    processedMessage.responseNeeded = false;
    processedMessage.editedResponseNeeded = true;
  } else if (cmd === "weapons") {
    processedMessage.responseToEdit = await messageController.SendMessage(
      processedMessage.channel,
      "Searching the great library...",
      processedMessage.embed
    );
    processedMessage.response = await getAllRelevantEquipment(cmd);
    processedMessage.responseNeeded = false;
    processedMessage.editedResponseNeeded = true;
  } else if (cmd === "armors") {
    processedMessage.responseToEdit = await messageController.SendMessage(
      processedMessage.channel,
      "Searching the great library...",
      processedMessage.embed
    );
    processedMessage.response = await getAllRelevantEquipment(cmd);
    processedMessage.responseNeeded = false;
    processedMessage.editedResponseNeeded = true;
  } else if (cmd === "ag") {
    processedMessage.responseToEdit = await messageController.SendMessage(
      processedMessage.channel,
      "Searching the great library...",
      processedMessage.embed
    );
    processedMessage.response = await getAllRelevantEquipment(cmd);
    processedMessage.responseNeeded = true;
    processedMessage.editedResponseNeeded = true;
  } else if (cmd === "mi") {
    processedMessage.responseToEdit = await messageController.SendMessage(
      processedMessage.channel,
      "Searching the great library...",
      processedMessage.embed
    );
    processedMessage.response = await getAllRelevantEquipment(cmd);
    processedMessage.responseNeeded = true;
    processedMessage.editedResponseNeeded = true;
  } else if (cmd === "rc") {
    processedMessage.response = await registerCharacter(
      processedMessage.player.playerID,
      processedMessage.player.playerUserName,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "gs") {
    processedMessage.response = await goldFunctions.goldStatus(
      processedMessage.player.playerID,
      processedMessage.embed
    );
  } else if (cmd === "active") {
    processedMessage.response = await setActiveCharacter(
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "gg") {
    processedMessage.response = await goldFunctions.giveGold(
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "agg") {
    processedMessage.response = await goldFunctions.adminGiveGold(
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "pay") {
    processedMessage.response = await goldFunctions.pay(
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "creategame") {
    processedMessage.response = await createANewGame(
      processedMessage.player.playerUserName,
      processedMessage.player.playerID
    );
  } else if (cmd === "setgamedate") {
    processedMessage.response = await setGameDate(
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "setgamedesc") {
    processedMessage.response = await setGameDesc(
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "signup") {
    processedMessage.response = await signUp(
      processedMessage.player.playerUserName,
      processedMessage.player.playerID,
      processedMessage.parsedMessage.variables
    );
  } else if (cmd === "showgames") {
    processedMessage.response = await showActiveGames();
  } else {
    processedMessage.response =
      "I cant understand what you're saying, please be more precise!\nUnrecognized Command";
  }
};
