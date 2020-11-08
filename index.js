const { Client } = require("discord.js");

const discord = require("discord.js");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const JsonTable = require("./jsonTable");

const DBPaths = {
  gamesTablePath: "databases/games.json",
  countersTablePath: "databases/counters.json",
  charactersTablePath: "databases/characters.json",
  characterByIDTablePath: "databases/characterByID.json",
  transactionsTablePath: "databases/transactions.json",
  permissionsTablePath: "databases/permissions.json",
};

const MessageController = (function () {
  return {
    SendMessage: async function (channel, content, responseEmbed) {
      if (
        responseEmbed.embedNeeded !== undefined &&
        responseEmbed.embedNeeded
      ) {
        const embedToBroadcast = new discord.MessageEmbed();
        embedToBroadcast.setTitle(responseEmbed.title);
        if (responseEmbed.color !== undefined) {
          embedToBroadcast.color = responseEmbed.color;
        }
        embedToBroadcast.setDescription(content);
        if (responseEmbed.thumbnail !== undefined) {
          embedToBroadcast.attachFiles([responseEmbed.thumbnail]);
          console.log(
            responseEmbed.thumbnail.split("/")[
              responseEmbed.thumbnail.split("/").length - 1
            ]
          );
          embedToBroadcast.setThumbnail(
            `attachment://${
              responseEmbed.thumbnail.split("/")[
                responseEmbed.thumbnail.split("/").length - 1
              ]
            }`
          );
        }
        return await channel.send(embedToBroadcast);
      }

      return await channel.send(content);
    },
    EditMessage: function (responseToEdit, editedContent) {
      responseToEdit.edit(editedContent);
    },
    ProcessMessage: function (message) {
      console.log(`${message.author.username} said: ${message.content}`);

      const serverResponse = {
        workNeeded: false,
        responseNeeded: false,
        response: "",
        editedResponseNeeded: false,
        responseToEdit: undefined,
        channel: undefined,
        embed: {},
      };

      const prefix = process.env.PREFIX;
      const content = message.content.toLowerCase();
      const channel = message.channel;

      if (content === "hi bot" || content === "hey bot") {
        serverResponse.responseNeeded = true;
        serverResponse.response = "Hello to you as well Mortal!";
        serverResponse.channel = channel;
        return serverResponse;
      } else if (message.author.bot) {
        return serverResponse;
      } else if (content.startsWith(prefix)) {
        serverResponse.channel = channel;
        serverResponse.workNeeded = true;

        serverResponse["player"] = {
          playerID: message.author.id,
          playerUserName: message.author.username,
        };

        const splitMessage = content.split(" ");

        serverResponse["parsedMessage"] = {
          command: splitMessage[0].slice(1, splitMessage[0].length),
          variables: splitMessage.slice(1, splitMessage.length).join(" "),
        };
      }

      return serverResponse;
    },
  };
})();

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
        console.log(player.PlayerID);
        console.log(playerID);
        console.log(player.PlayerID === playerID);
        if (player.PlayerID === playerID) {
          console.log("what");
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

const countersDAO = require("./daos/countersDAO.js");

const charactersDAO = require("./daos/charactersDAO.js");

const characterByIDDAO = require("./daos/characterByIDDAO.js");

const transactionsDAO = require("./daos/transactionDAO");

const permissionsDAO = require("./daos/permissionsDAO.js");

const facadeController = (function () {
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
      "Dice Rolls - /roll [Number]d[Number]+[Number]\n" +
      "\n" +
      "Game Material:\n" +
      "Searching for a spell (Only SRD) - /spell [Name]\n" +
      "\n" +
      "Game Managing:\n" +
      "Create a new game - /creategame\n" +
      "Set a game date - /setgamedate [GameNumber] [Date]\n" +
      "Set a game description - /setgamedesc [GameNumber] [Description]\n" +
      "Show active games - /showgames\n" +
      "Show game - /showgame [GameNumber]\n" +
      "Sign up to a game (A) - /signup [GameNumber]\n" +
      "Close game - /closegame [GameNumber]\n" +
      "\n" +
      "Gold Trade:\n" +
      "Register a character - /rc [CharacterName]\n" +
      "View your characters gold status - /gs\n" +
      "Change active character - /active [CharacterID]\n" +
      "Make a payment (A) - /pay [Amount]\n" +
      "Transfer gold to another character (A) - /gg [ReceivingCharacterID] [Amount]\n" +
      "\n" +
      "Commands marked with (A) uses your current active character."
    );
  };

  //Rolls
  const commandRoll = function (str) {
    let messageRegex = new RegExp("([0-9]+)d([0-9]+)(\\+([0-9]+))*", "g");
    let messageRegexResult = str.toLowerCase().match(messageRegex);
    if (
      messageRegexResult != null &&
      messageRegexResult[0] === str.toLowerCase()
    ) {
      const values = {
        rolls: [],
        modifiers: 0,
        sum: 0,
      };
      let diceRollRegex = new RegExp("([0-9]+)d([0-9]+)");
      let diceRollRegexResult = str.toLowerCase().match(diceRollRegex);
      for (let i = 0; i < parseInt(diceRollRegexResult[1]); i++) {
        let roll =
          Math.floor(Math.random() * parseInt(diceRollRegexResult[2])) + 1;
        values.sum = values.sum + roll;
        values.rolls.push(roll);
      }
      let modifiersRegex = new RegExp("((?<=\\+)[0-9]+)+", "g");
      let modifiersRegexResult = str.toLowerCase().match(modifiersRegex);
      if (modifiersRegexResult !== null) {
        modifiersRegexResult.forEach((element) => {
          values.modifiers = values.modifiers + parseInt(element);
          values.sum = values.sum + parseInt(element);
        });
      }
      return values;
    } else {
      return null;
    }
  };
  const commandRollStringBuilder = function (result) {
    if (result !== null) {
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
  const getSpellStringBuilder = function (result) {
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

  //Register Character
  const registerCharacter = function (playerID, playerUserName, variables) {
    const characterCounterString = "characterCounter";

    //gather information
    const characterName =
      variables.charAt(0).toUpperCase() + variables.slice(1);
    const newCharacterID = countersDAO.getCounter(characterCounterString);

    let firstCharacter = false;

    //build a new player character list
    if (!charactersDAO.playerCharacterListExists(playerID)) {
      charactersDAO.createCharacterList(playerID, playerUserName);
      firstCharacter = true;
    }

    //push the new character into the player characters list
    charactersDAO.writeNewCharacter(
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

  //Gold Status
  const getGoldStatusStringBuilder = function (playerID) {
    let status = "";
    const playerCharacters = charactersDAO.getPlayerCharacterList(playerID);
    playerCharacters.forEach((character) => {
      status += `${character.CharacterName} (`;
      if (character.ActiveCharacter === true) {
        status += `Active, `;
      }
      status += `ID = ${character.CharacterID}): ${character.Gold} gp\n`;
    });
    return status;
  };
  const goldStatus = function (playerID, embed) {
    const goldStatus = getGoldStatusStringBuilder(playerID);
    if (goldStatus === "") {
      embed["embedNeeded"] = false;
      return "It seems that you dont have any characters.\nA shame really, guess ill have to find treasure elsewhere.\n* Flies away *\nNo characters associated to this user.";
    }
    embed["embedNeeded"] = true;
    embed["color"] = 2123412;
    embed["title"] = "Gold Status";
    embed["thumbnail"] = "assets/dm.jpg";

    return goldStatus;
  };

  //Active Character
  const setActiveCharacter = function (playerID, variables) {
    const newCharacterID = variables.split(" ")[0];
    if (
      characterByIDDAO.characterExists(newCharacterID) &&
      characterByIDDAO.characterBelongsToPlayer(playerID, newCharacterID)
    ) {
      const activeCharacterID = charactersDAO.getActiveCharacter(playerID)
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

  //Give Gold Functions
  const goldTransaction = function (
    playerGiverID,
    characterGiverID,
    playerReceiverID,
    characterReceiverID,
    gold
  ) {
    //reduce from giver
    charactersDAO.addGoldToCharacter(playerGiverID, characterGiverID, -gold);

    //increase receiver
    charactersDAO.addGoldToCharacter(
      playerReceiverID,
      characterReceiverID,
      gold
    );

    //record the transaction in the transactions json
    transactionsDAO.recordTransactionDetails(
      characterGiverID,
      characterReceiverID,
      gold,
      countersDAO.getCounter("transactions")
    );

    countersDAO.increaseCounter("transactions");
  };
  const giveGold = function (playerGiverID, variables) {
    //get information
    if (variables.split(" ").length < 2) {
      return "Invalid input";
    }

    const characterGiverID = charactersDAO.getActiveCharacter(playerGiverID)
      .CharacterID;
    const characterReceiverID = variables.split(" ")[0];
    const playerReceiverID = characterByIDDAO.getACharacterPlayer(
      characterReceiverID
    );
    const gold = variables.split(" ")[1];

    //player doesn't have any characters
    if (characterGiverID === undefined) {
      return "You don't seem to represent any known individual!\nNo active character found";
    }
    //giving gold to yourself
    if (characterGiverID == characterReceiverID) {
      return "Giving gold to yourself even though its possible is just stupid.\nTransaction Successful?";
    }

    //giving negative gold
    if (Number(gold) < 0) {
      return "You think you can outwit me fool?\nNice try...";
    }

    //check if character exists
    if (characterByIDDAO.characterExists(characterReceiverID)) {
      //Enough gold to give
      if (
        charactersDAO.getCharacterGold(playerGiverID, characterGiverID) >= gold
      ) {
        //perform the transaction
        goldTransaction(
          playerGiverID,
          characterGiverID,
          playerReceiverID,
          characterReceiverID,
          gold
        );

        return "Transaction Successful!";
      }

      //the Giver character is not viable for the transaction
      return "Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n";
    } else {
      return "I was'nt able to find that PersonBeastOoze entity!\nCharacter not found";
    }
  };
  const adminGiveGold = function (playerGiverID, variables) {
    //get information
    const characterID = variables.split(" ")[0];
    const gold = variables.split(" ")[1];

    //check for admin permissions
    if (permissionsDAO.userHasAdminRights(playerGiverID)) {
      //check if the receiver character exists
      if (characterByIDDAO.characterExists(characterID)) {
        //transfer the gold
        charactersDAO.addGoldToCharacter(
          characterByIDDAO.getACharacterPlayer(characterID),
          characterID,
          gold
        );

        //record the transfer
        transactionsDAO.recordTransactionDetails(
          "Admin",
          characterID,
          gold,
          countersDAO.getCounter("transactions")
        );

        //update transaction counter in the counters json
        countersDAO.increaseCounter("transactions");

        return "The gold was delievered to the character!\n";
      } else {
        return "I am sorry my lord, i could'nt find the creature.\nTransfer failed.";
      }
    } else {
      return "You are not powerful enough to use this command!\n";
    }
  };
  const pay = function (playerID, variables) {
    //get information
    const gold = variables.split(" ")[0];
    const characterPayerID = charactersDAO.getActiveCharacter(playerID)
      .CharacterID;

    //player doesn't have any characters
    if (characterPayerID === undefined) {
      return "You don't seem to represent any known individual!\nNo active character found";
    }

    //paying negative gold
    if (gold < 0) {
      return "Not gonna work...";
    }

    //Enough gold to make payment
    if (charactersDAO.getCharacterGold(playerID, characterPayerID) >= gold) {
      //perform the transaction
      charactersDAO.addGoldToCharacter(playerID, characterPayerID, -gold);

      return "Transaction Successful!";
    }

    //the Giver character is not viable for the transaction
    return "Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n";
  };

  //Game Managing Functions
  const createANewGame = function (playerUserName, playerID) {
    const newGameID = countersDAO.getCounter("gameCounter");
    gamesDAO.createAGame(newGameID, playerUserName, playerID);
    countersDAO.increaseCounter("gameCounter");
    return `The quest has been declared!\nNow gather worthy adventurers to aid you.\nGame number is: ${newGameID}`;
  };
  const gameChecks = function (checksNeeded, playerID, gameID, variables) {
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
  const setGameDate = function (playerID, variables) {
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
  const setGameDesc = function (playerID, variables) {
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
  const signUp = function (playerUserName, playerID, variables) {
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
  const showActiveGames = function () {
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

  return {
    DoWork: async function (processedMessage) {
      processedMessage.responseNeeded = true;
      if (processedMessage.parsedMessage.command === "help") {
        processedMessage.response = help(processedMessage.embed);
      } else if (processedMessage.parsedMessage.command === "roll") {
        processedMessage.response = roll(
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "spell") {
        processedMessage.responseToEdit = await MessageController.SendMessage(
          processedMessage.channel,
          "Searching the great library..."
        );
        processedMessage.response = await getSpell(
          processedMessage.parsedMessage.variables
        );
        processedMessage.responseNeeded = false;
        processedMessage.editedResponseNeeded = true;
      } else if (processedMessage.parsedMessage.command === "rc") {
        processedMessage.response = registerCharacter(
          processedMessage.player.playerID,
          processedMessage.player.playerUserName,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "gs") {
        processedMessage.response = goldStatus(
          processedMessage.player.playerID,
          processedMessage.embed
        );
      } else if (processedMessage.parsedMessage.command === "active") {
        processedMessage.response = setActiveCharacter(
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "gg") {
        processedMessage.response = giveGold(
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "agg") {
        processedMessage.response = adminGiveGold(
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "pay") {
        processedMessage.response = pay(
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "creategame") {
        processedMessage.response = createANewGame(
          processedMessage.player.playerUserName,
          processedMessage.player.playerID
        );
      } else if (processedMessage.parsedMessage.command === "setgamedate") {
        processedMessage.response = setGameDate(
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "setgamedesc") {
        processedMessage.response = setGameDesc(
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "signup") {
        processedMessage.response = signUp(
          processedMessage.player.playerUserName,
          processedMessage.player.playerID,
          processedMessage.parsedMessage.variables
        );
      } else if (processedMessage.parsedMessage.command === "showgames") {
        processedMessage.response = showActiveGames();
      } else {
        processedMessage.response =
          "I cant understand what you're saying, please be more precise!\nUnrecognized Command";
      }
    },
  };
})();

const joinServerChannel = process.env.NEWPLAYERCHANNEL;

const client = new Client({
  disableEveryone: true,
});

client.on("ready", () => {
  console.log("The Dragon has awaken!");

  client.user.setStatus("online");
  client.user.setActivity("Dungeons and Dragons", {
    type: "PLAYING",
  });
});
client.on("message", async (message) => {
  const processedMessage = MessageController.ProcessMessage(message);
  if (processedMessage.workNeeded) {
    await facadeController.DoWork(processedMessage);
  }
  if (processedMessage.responseNeeded) {
    MessageController.SendMessage(
      processedMessage.channel,
      processedMessage.response,
      processedMessage.embed
    );
  }
  if (processedMessage.editedResponseNeeded) {
    MessageController.EditMessage(
      processedMessage.responseToEdit,
      processedMessage.response
    );
  }
});
client.on("guildMemberAdd", (member) => {
  console.log("a player has joined the server");
  member.guild.channels.cache
    .get(joinServerChannel)
    .send(
      `${member.user.username} the brave has joined the quest!\\nMay his path lead to wealth and not an inevitable doom.`
    );
  let role = member.guild.roles.find("name", "Player");
  member.addRole(role);
});

client.login(process.env.TOKEN);
