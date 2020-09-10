const { Client } = require("discord.js");

const discord = require("discord.js");

const { config } = require("dotenv");

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const fs = require('fs')

const Table = require("./DAO");

const DBPaths = {
    gamesTablePath: 'databases/games.json',
    countersTablePath: 'databases/counters.json',
    charactersTablePath: 'databases/characters.json',
    characterByIDTablePath: 'databases/characterByID.json',
    transactionsTablePath: 'databases/transactions.json',
    permissionsTablePath: 'databases/permissions.json'
};

const MessageController = (function() {

    return {
        SendMessage: async function(channel, content, responseEmbed) {

            if(responseEmbed.embedNeeded !== undefined && responseEmbed.embedNeeded){
                const embedToBroadcast = new discord.MessageEmbed();
                embedToBroadcast.setTitle(responseEmbed.title);
                if(responseEmbed.color!==undefined){
                    embedToBroadcast.color = responseEmbed.color;
                }
                embedToBroadcast.setDescription(content);
                if(responseEmbed.thumbnail !== undefined){
                    embedToBroadcast.attachFiles([responseEmbed.thumbnail])
                    embedToBroadcast.setThumbnail(`attachment://${responseEmbed.thumbnail.split("/")[responseEmbed.thumbnail.split("/").length-1]}`);
                }
                return await channel.send(embedToBroadcast);
            }

            return await channel.send(content);

        },
        EditMessage: function(responseToEdit, editedContent) {
            responseToEdit.edit(editedContent);
        },
        ProcessMessage: function(message) {
            console.log(`${message.author.username} said: ${message.content}`)

            const serverResponse = {
                workNeeded: false,
                responseNeeded: false,
                response: "",
                editedResponseNeeded: false,
                responseToEdit: undefined,
                channel: undefined,
                embed: {}
            }

            const prefix = process.env.PREFIX;
            const content = message.content.toLowerCase();
            const channel = message.channel;


            if(content === "hi bot" || content === "hey bot"){
                serverResponse.responseNeeded = true;
                serverResponse.response = "Hello to you as well Mortal!";
                serverResponse.channel = channel;
                return serverResponse;
            } else if(message.author.bot) {
                return serverResponse;
            } else if(content.startsWith(prefix)){
                serverResponse.channel = channel;
                serverResponse.workNeeded = true;
    
                serverResponse["player"] = {
                    "playerID": message.author.id,
                    "playerUserName": message.author.username
                }
    
                const splitMessage = content.split(' ');
    
                serverResponse["parsedMessage"] = {
                    "command": splitMessage[0].slice(1,splitMessage[0].length),
                    "variables": splitMessage.slice(1,splitMessage.length).join(' ')
                }
            }

            return serverResponse;
        }


    }
})();

const gamesDAO = (function() {
    const gamesTable = new Table(DBPaths.gamesTablePath);
    gamesTable.ReadTable();
    return {
        playerIsGameCreator: function(playerID ,gameNumber){
            if(gamesTable.Read(gameNumber).CreatorID == playerID){
                return true
            }
            return false;
        },
        gameIsFullyBooked: function(gameNumber){
            if(gamesTable.Read(gameNumber).Players.length == games["maxPlayers"]){
                return true
            }
            return false;
        },
        getAGamePlayersList: function(gameNumber){
            return gamesTable.Read(gameNumber).Players;
        }
    }
})();

const countersDAO = (function() {
    const countersTable = new Table(DBPaths.countersTablePath);
    countersTable.ReadTable();
    return {
        getCounter: function(key){
            return countersTable.Read(key);
        },
        increaseCounter: function(key){
            countersTable.Write(key, countersTable.Read(key)+1);
            countersTable.UpdateTable();
        }
    }
})();

const charactersDAO = (function() {
    const charactersTable = new Table(DBPaths.charactersTablePath);
    charactersTable.ReadTable();
    return {
        playerCharacterListExists: function(playerID){
            if(charactersTable.Read(playerID) !== undefined){
                return true;
            }
            return false;
        },
        addGoldToCharacter: function(playerID, characterID, gold){
            const characterList = charactersTable.Read(playerID).Characters;
            const characterToGiveGoldTo = characterList.find(character => {
                if(character.CharacterID === Number(characterID)){
                    return character;
                }
            });
            characterToGiveGoldTo.Gold += Number(gold);
            charactersTable.UpdateTable(); 
        },
        getPlayerCharacterList: function(playerID){
            return charactersTable.Read(playerID).Characters;
        },
        createCharacterList: function(playerID, playerUserName){
            charactersTable.Write(playerID, {
                "Creator" : playerUserName,
                "Characters" : []
            });
        },
        writeNewCharacter: function(playerID, characterName, newCharacterID, isActiveCharacter){
            charactersTable.Read(playerID).Characters.push({
                "CharacterName" : characterName,
                "Gold" : 0,
                "CharacterID" : newCharacterID,
                "ActiveCharacter" : isActiveCharacter
            });
            charactersTable.UpdateTable(); 
        },
        getActiveCharacter: function(playerID){
            const characterList = charactersTable.Read(playerID).Characters;
            const activeCharacter = characterList.find(character => {
                if(character.ActiveCharacter === true){
                    return character;
                }
            });
            return activeCharacter;
        },
        changeActiveCharacter: function(playerID, oldActiveCharacter, newActiveCharacter){
            const characterList = charactersTable.Read(playerID).Characters;
            characterList.forEach(character => {
                if(character.CharacterID === oldActiveCharacter || character.CharacterID === Number(newActiveCharacter)){
                    character.ActiveCharacter = !character.ActiveCharacter;
                }
            });
            charactersTable.UpdateTable(); 
        },
        getCharacterGold: function(playerID, characterID){
            const characterList = charactersTable.Read(playerID).Characters
            const characterGold = characterList.find(character => {
                if(character.CharacterID === characterID)
                return character;
            });
            return characterGold.Gold;
        }
    }
})();

const characterByIDDAO = (function() {
    const characterByIDTable = new Table(DBPaths.characterByIDTablePath);
    characterByIDTable.ReadTable();
    return {
        characterExists: function(characterID){
            if(characterByIDTable.Read(characterID) !== undefined){
                return true;
            }
            return false;
        },

        characterBelongsToPlayer: function(playerID, characterID){
            if(characterByIDTable.Read(characterID).PlayerID === playerID){
                return true;
            }
            return false;
        },

        addCharacterByID: function(characterID, characterName, playerID){
            characterByIDTable.Write(characterID, {
                "CharacterName" : characterName,
                "PlayerID" : playerID
            });
            characterByIDTable.UpdateTable();
        },
        
        getACharacterPlayer: function(characterID){
            return characterByIDTable.Read(characterID).PlayerID;
        }
    }
})();

const transactionsDAO = (function() {
    const transactionsTable = new Table(DBPaths.transactionsTablePath);
    transactionsTable.ReadTable();
    return {
        recordTransactionDetails: function(characterGiverID, characterReceiverID, gold, transactionCounter){
    
            //add transaction to the transaction json
            transactionsTable.Write(transactionCounter, {
                "CharacterGiverID" : characterGiverID,
                "CharacterReceiverID" : characterReceiverID,
                "Gold" : gold
            });

            transactionsTable.UpdateTable();
        }
    }
})();

const permissionsDAO = (function() {
    const permissionsTable = new Table(DBPaths.permissionsTablePath);
    permissionsTable.ReadTable();
    return {
        userHasAdminRights: function(playerID){
            if(permissionsTable.Read("admin").find(element => element == playerID)){
                return true;
            }
            return false;
        }
    }
})();

const facadeController = (function() {

    //Help
    const help = function(embed){

        embed["embedNeeded"] = true;
        embed["color"] = 7419530;
        embed["title"] = "Help";
        embed["thumbnail"] = "assets/Thural.jpg";
        return "I usually dont take commands from the likes of you but for now ill make an exception.\n"+
        "The commands are:\n\n"+
        "Dice:\n"+
        "Dice Rolls - /roll [Number]d[Number]+[Number]\n"+
        "\n"+
        "Game Material:\n"+
        "Searching for a spell (Only SRD) - /spell [Name]\n"+
        "\n"+
        "Game Managing:\n"+
        "Create a new game - /creategame\n"+
        "Set a game date - /setgamedate [GameNumber] [Date]\n"+
        "Set a game description - /setgamedesc [GameNumber] [Description]\n"+
        "Show active games - /showgames\n"+
        "Sign up to a game - /signup [CharacterName] [GameNumber]\n"+
        "\n"+
        "Gold Trade:\n"+
        "Register a character - /rc [CharacterName]\n"+
        "View your characters gold status - /gs\n"+
        "Change active character - /active [CharacterID]\n"+
        "Make a payment - /pay [YourCharacterID] [Amount]\n"+
        "Transfer gold to another character - /gg [ReceivingCharacterID] [Amount]\n";
    };

    //Rolls
    const commandRoll = function(str){
        let messageRegex = new RegExp('([0-9]+)d([0-9]+)(\\+([0-9]+))*', 'g')
        let messageRegexResult = str.toLowerCase().match(messageRegex);
        if(messageRegexResult!=null && messageRegexResult[0]===str.toLowerCase()){
            const values = {
                rolls:[],
                modifiers:0,
                sum:0
            }
            let diceRollRegex = new RegExp('([0-9]+)d([0-9]+)')
            let diceRollRegexResult = str.toLowerCase().match(diceRollRegex);
            for(let i=0;i<parseInt(diceRollRegexResult[1]);i++){
                let roll = Math.floor(Math.random() * parseInt(diceRollRegexResult[2])) + 1
                values.sum = values.sum + roll
                values.rolls.push(roll)
            }
            let modifiersRegex = new RegExp('((?<=\\+)[0-9]+)+', 'g')
            let modifiersRegexResult = str.toLowerCase().match(modifiersRegex);
            if(modifiersRegexResult!==null){
                modifiersRegexResult.forEach(element => {
                    values.modifiers = values.modifiers + parseInt(element)
                    values.sum = values.sum + parseInt(element)
                });
            }
            return values
        }
        else{
            return null
        }
    };
    const commandRollStringBuilder = function(result){
        if(result!==null){
            let returnMessage = (`Total: ${result.sum}\n`)
            result.rolls.forEach(element => {
                returnMessage = returnMessage+`${element}, `
            });
            returnMessage = returnMessage.substring(0,returnMessage.length-2)
            returnMessage = returnMessage+(`\nWith a +${result.modifiers} modifier`)
            return returnMessage
        }
        else{
            return "You roll dice wrong.\nFoolish Human!"
        }
    };
    const roll = function(variables){
        return commandRollStringBuilder(commandRoll(variables));
    };

    //Spells
    const getSpellHttpRequest = function(str){
        return new Promise(function (resolve, reject){
            let request = new XMLHttpRequest();
            request.open("GET", `http://www.dnd5eapi.co/api/spells/${str}`);
            request.onload = function() {
                if(this.readyState === 4 && this.status === 200) {
                    let response = JSON.parse(this.responseText)
                    resolve(response)
                }
                else{
                    resolve(null)
                }
            };
            request.send();
        });
    };
    const getSpellStringBuilder = function(result){
        if(result!==null){
            let returnMessage = (`${result.name}\n`)
    
            //Level, School, Ritual
            returnMessage = returnMessage + (`Level ${result.level} ${result.school.name}`)
            if(result.ritual){
                returnMessage = returnMessage.concat(` (ritual)`)
            }
            returnMessage = returnMessage.concat(`\n`)

            returnMessage = returnMessage + (`Casting Time: ${result.casting_time}\n`)
            returnMessage = returnMessage + (`Range: ${result.range}\n`)
            //End Level, School, Ritual
            
            //Components
            returnMessage = returnMessage + (`Components: `)
            result.components.forEach(element => {
                returnMessage = returnMessage+`${element},`
            });
            returnMessage = returnMessage.slice(0,returnMessage.length-1)
            if(result.material !== "" & result.material !== undefined){
                returnMessage = returnMessage+` (${result.material})`;
            }
            returnMessage = returnMessage.concat(`\n`);

            //End components
    
            //Duration
            if(result.concentration === true){
                returnMessage = returnMessage+`Duration: Concentration, ${result.duration}`
            }
            else{
                returnMessage = returnMessage+`Duration: ${result.duration}`
            }
            returnMessage = returnMessage+`\n`
            //End duration
    
            //Description
            result.desc.forEach(element => {
                returnMessage = returnMessage+`${element}\n`
            });
            if(result.higher_level !== undefined){
                result.higher_level.forEach(element => {
                    returnMessage = returnMessage+`${element}\n`
                });
            }
            //End description
    
            return returnMessage
        }
        else{
            return "Spell wasn't found"
        }
    };
    const getSpell = async function(variables){
        const result = await getSpellHttpRequest(variables.replace(" ", "-"));
        return getSpellStringBuilder(result);
    }

    //Register Character
    const registerCharacter = function(playerID, playerUserName, variables){

        const characterCounterString = "characterCounter";

        //gather information
        const characterName = variables.charAt(0).toUpperCase() + variables.slice(1);
        const newCharacterID = countersDAO.getCounter(characterCounterString);

        let firstCharacter = false;

        //build a new player character list
        if(!charactersDAO.playerCharacterListExists(playerID)){
            charactersDAO.createCharacterList(playerID,playerUserName);
            firstCharacter = true;
        }

        //push the new character into the player characters list
        charactersDAO.writeNewCharacter(playerID, characterName, newCharacterID, firstCharacter);

        //push the new character into the characterByID table
        characterByIDDAO.addCharacterByID(newCharacterID, characterName, playerID)

        //updating tables
        countersDAO.increaseCounter(characterCounterString);

        return `Its good meeting you ${characterName}! Your number is ${newCharacterID}`;
    };

    //Gold Status
    const getGoldStatusStringBuilder = function(playerID){
        let status = "";
        const playerCharacters = charactersDAO.getPlayerCharacterList(playerID);
        playerCharacters.forEach((character) => {
            status += `${character.CharacterName} (`
            if(character.ActiveCharacter === true){
                status += `Active, `
            }
            status += `ID = ${character.CharacterID}): ${character.Gold} gp\n`;
        })
        return status
    };
    const goldStatus = function(playerID, embed){
        const goldStatus = getGoldStatusStringBuilder(playerID);
        if(goldStatus === ""){
            embed["embedNeeded"] = false;
            return "It seems that you dont have any characters.\nA shame really, guess ill have to find treasure elsewhere.\n* Flies away *\nNo characters associated to this user."; 
            
        }
        embed["embedNeeded"] = true;
        embed["color"] = 2123412;
        embed["title"] = "Gold Status"
        embed["thumbnail"] = "assets/dm.jpg";

        return goldStatus;
    };

    //Active Character
    const setActiveCharacter = function(playerID, variables){

        const newCharacterID = variables.split(' ')[0];
        if(characterByIDDAO.characterExists(newCharacterID) && characterByIDDAO.characterBelongsToPlayer(playerID, newCharacterID)){
            const activeCharacterID = charactersDAO.getActiveCharacter(playerID).CharacterID;
            if(activeCharacterID === Number(newCharacterID)){
                return "This character is already your active character." 
            }
            else{
                charactersDAO.changeActiveCharacter(playerID, activeCharacterID, newCharacterID);
                return `Success! new character ID is: ${newCharacterID}`;
            }
        }
        return `Character not found or it doesn't belong to you`
    };

    //Give Gold Functions
    const goldTransaction = function(playerGiverID, characterGiverID, playerReceiverID, characterReceiverID, gold){

        //reduce from giver
        charactersDAO.addGoldToCharacter(playerGiverID, characterGiverID, -gold)
    
        //increase receiver
        charactersDAO.addGoldToCharacter(playerReceiverID, characterReceiverID, gold)
        
        //record the transaction in the transactions json
        transactionsDAO.recordTransactionDetails(characterGiverID, characterReceiverID, gold, countersDAO.getCounter("transactions"));

        countersDAO.increaseCounter("transactions");
    
    };
    const giveGold = function(playerGiverID, variables){

        //get information
        if(variables.split(' ').length < 2) {
            return "Invalid input"
        }

        const characterGiverID = charactersDAO.getActiveCharacter(playerGiverID).CharacterID;
        const characterReceiverID = variables.split(' ')[0]
        const playerReceiverID = characterByIDDAO.getACharacterPlayer(characterReceiverID);
        const gold = variables.split(' ')[1]
        
        //player doesn't have any characters
        if(characterGiverID === undefined){
            return "You don't seem to represent any known individual!\nNo active character found";
        }
        //giving gold to yourself
        if(characterGiverID == characterReceiverID){
            return "Giving gold to yourself even though its possible is just stupid.\nTransaction Successful?";
        }

        //giving negative gold
        if(Number(gold)<0){
            return "You think you can outwit me fool?\nNice try...";
        }

        //check if character exists
        if(characterByIDDAO.characterExists(characterReceiverID)){

            //Enough gold to give
            if(charactersDAO.getCharacterGold(playerGiverID, characterGiverID) >= gold){

                //perform the transaction
                goldTransaction(playerGiverID, characterGiverID, playerReceiverID, characterReceiverID, gold);

                return 'Transaction Successful!';
            }

            //the Giver character is not viable for the transaction
            return 'Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n';
        }
        else{
            return "I was\'nt able to find that Person\Beast\Ooze entity!\nCharacter not found";
        }
    };
    const adminGiveGold = function(playerGiverID, variables){

        //get information
        const characterID = variables.split(' ')[0]
        const gold = variables.split(' ')[1]

        //check for admin permissions
        if(permissionsDAO.userHasAdminRights(playerGiverID)){

            //check if the receiver character exists
            if(characterByIDDAO.characterExists(characterID)){

                //transfer the gold
                charactersDAO.addGoldToCharacter(characterByIDDAO.getACharacterPlayer(characterID), characterID, gold);

                //record the transfer
                transactionsDAO.recordTransactionDetails('Admin', characterID, gold, countersDAO.getCounter("transactions"))

                //update transaction counter in the counters json
                countersDAO.increaseCounter("transactions");

                return "The gold was delievered to the character!\n";
            }
            else{
                return "I am sorry my lord, i could\'nt find the creature.\nTransfer failed.";
            }
        }
        else{
            return "You are not powerful enough to use this command!\n";
        }
    };
    const pay = function(playerID, variables){

        //get information
        const gold = variables.split(' ')[0];
        const characterPayerID = charactersDAO.getActiveCharacter(playerID).CharacterID;

        //player doesn't have any characters
        if(characterPayerID === undefined){
            return "You don't seem to represent any known individual!\nNo active character found";
        }

        //paying negative gold
        if(gold<0){
            return "Not gonna work...";
        }

        //Enough gold to make payment
        if(charactersDAO.getCharacterGold(playerID, characterPayerID) >= gold){

            //perform the transaction
            charactersDAO.addGoldToCharacter(playerID, characterPayerID, -gold)

            return 'Transaction Successful!';
        }

        //the Giver character is not viable for the transaction
        return 'Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n';
    };
    


    return {
        DoWork: async function(processedMessage){
            processedMessage.responseNeeded = true;
            if(processedMessage.parsedMessage.command === "help"){
                processedMessage.response = help(processedMessage.embed);
            } else if(processedMessage.parsedMessage.command === "roll"){
                processedMessage.response = roll(processedMessage.parsedMessage.variables);
            } else if(processedMessage.parsedMessage.command === "spell"){
                processedMessage.responseToEdit = await MessageController.SendMessage(processedMessage.channel, "Searching the great library...");
                processedMessage.response = await getSpell(processedMessage.parsedMessage.variables);
                processedMessage.responseNeeded = false;
                processedMessage.editedResponseNeeded = true;
            } else if(processedMessage.parsedMessage.command === "rc"){
                processedMessage.response = registerCharacter(processedMessage.player.playerID,processedMessage.player.playerUserName,processedMessage.parsedMessage.variables);
            } else if(processedMessage.parsedMessage.command === "gs") {
                processedMessage.response = goldStatus(processedMessage.player.playerID, processedMessage.embed);
            } else if(processedMessage.parsedMessage.command === "active") {
                processedMessage.response = setActiveCharacter(processedMessage.player.playerID, processedMessage.parsedMessage.variables);
            } else if(processedMessage.parsedMessage.command === "gg") {
                processedMessage.response = giveGold(processedMessage.player.playerID, processedMessage.parsedMessage.variables);
            } else if(processedMessage.parsedMessage.command === "agg") {
                processedMessage.response = adminGiveGold(processedMessage.player.playerID, processedMessage.parsedMessage.variables);
            } else if(processedMessage.parsedMessage.command === "pay") {
                processedMessage.response = pay(processedMessage.player.playerID, processedMessage.parsedMessage.variables)
            }
        },


        playerHasSignedUp: function(playerID,gameNumber){
            gamesDAO.getAGamePlayersList(gameNumber).forEach((player) => {
                if(player.PlayerID === playerID){
                    return true;
                }
            })
            return false;
        },
    }
})();;

const joinServerChannel = process.env.SERVER;


const client = new Client({
    disableEveryone: true
});

config({
    path: __dirname + "/.env"
});

client.on("ready", () =>{
    console.log("The Dragon has awaken!")

    client.user.setStatus('online')
    client.user.setActivity(
        "Dungeons and Dragons",
        {
            type:"PLAYING"
        }
    )
});
client.on("message", async message => {
    const processedMessage = MessageController.ProcessMessage(message);
    if(processedMessage.workNeeded){
        await facadeController.DoWork(processedMessage);
    }
    if(processedMessage.responseNeeded){

        MessageController.SendMessage(processedMessage.channel, processedMessage.response, processedMessage.embed);
    }
    if(processedMessage.editedResponseNeeded){

        MessageController.EditMessage(processedMessage.responseToEdit, processedMessage.response);
    }
})
client.on("aaaaa", async message => {
    // console.log(`${message.author.username} said: ${message.content}`)
    let prefix = '/'
    let msg = message.content
    // if(msg.toLowerCase() == "hi bot" || msg.toLowerCase() == "hey bot"){
    //     message.channel.send("Hello to you as well Mortal!")
    //     return
    // }
    if(!msg.startsWith(prefix)|message.author.bot){
        return
    }
    else if(msg.startsWith(prefix)){
        if(msg.toLowerCase().startsWith("/help")){
            message.channel.send("I usually dont take commands from the likes of you but for now ill make an exception.\n"+
            "The commands are:\n\n"+
            "Dice:\n"+
            "Dice Rolls - /roll [Number]d[Number]+[Number]\n"+
            "\n"+
            "Game Material:\n"+
            "Searching for a spell (Only SRD) - /spell [Name]\n"+
            "\n"+
            "Game Managing:\n"+
            "Create a new game - /creategame\n"+
            "Set a game date - /setgamedate [GameNumber] [Date]\n"+
            "Set a game description - /setgamedesc [GameNumber] [Description]\n"+
            "Show active games - /showgames\n"+
            "Sign up to a game - /signup [CharacterName] [GameNumber]\n"+
            "\n"+
            "Gold Trade:\n"+
            "Register a character - /rc [CharacterName]\n"+
            "View your characters gold status - /gs\n"+
            "Change active character - /active [CharacterID]\n"+
            "Make a payment - /pay [YourCharacterID] [Amount]\n"+
            "Transfer gold to another character - /gg [ReceivingCharacterID] [Amount]\n")
        }
        // else if(msg.toLowerCase().startsWith("/roll")){
        //     message.channel.send(commandRollStringBuilder(commandRoll(msg.slice(6))))
        // }
        // else if(msg.toLowerCase().startsWith("/spell")){
        //     const reply = await message.channel.send("Searching the great library...");
        //     getSpell(msg.split(" ").slice(1).join("-"))
        //     .then(result => {
        //         reply.edit(getSpellStringBuilder(result))
        //     });
        // }
        else if(msg.toLowerCase().startsWith("/creategame")){
            games[countersTable.File.gameCounter] = {
                "Creator" : message.author.username,
                "CreatorID" : message.author.id,
                "GameNumber" : countersTable.File.gameCounter,
                "Players" : [],
                "Date" : null,
                "Description" : ""
            }

            gamesTable.UpdateTable();

            message.channel.send("The quest has been declared!\nNow gather worthy adventurers to aid you.\nGame number is: " + countersTable.File.gameCounter);

            countersTable.File.gameCounter++;
            countersTable.UpdateTable();
        }
        else if(msg.toLowerCase().startsWith("/showgames")){
            let gamesString = ""
            let games = gamesTable.File;
            for(let index in gamesTable.File){
                if(!isNaN(index)){
                    gamesString += "Game Number: "+games[index].GameNumber+"\nCreator: "+games[index].Creator+"\nDate: "+games[index].Date+"\nDescription: "+games[index].Description+"\nPlayers:"
                    games[index].Players.forEach((player) =>{
                        gamesString+="\n\t"+player.CharacterName
                    })
                    gamesString += "\n"
                }
            }
            message.channel.send(gamesString)
        }
        else if(msg.toLowerCase().startsWith("/setgamedate")){

            //get information
            let info = msg.split(' ')
            let gameNumber = info[1];
            let date = info.slice(2,info.length).join(' ');
            let playerID = message.author.id;

            //check command syntax
            if(info.length < 3 || isNaN(gameNumber)){
                message.channel.send("Stop with this Jibber Jabber!\nYou dont make sense!\nBad Command")
            }
            //check if game exists
            if(gamesTable.File[gameNumber] == null){
                message.channel.send("This quest does not exist.\nDont waste my time with this annoyances!")
            }
            //check if editing player is game creator
            else if(!playerIsGameCreator(playerID,(gameNumber))){
                message.channel.send("You are not the one in charge of this quest!")
            }
            //everything is ok - change the date
            else{
                gamesTable.File[gameNumber].Date = date
                gamesTable.UpdateTable();
                message.channel.send("We will march forward in " + date + ".\nDate update Successful.")
            }
        }
        else if(msg.toLowerCase().startsWith("/setgamedesc")){

            //get information
            let info = msg.split(' ')
            let gameNumber = info[1];
            let desc = info.slice(2,info.length).join(' ')
            let playerID = message.author.id;

            //check command syntax
            if(info.length < 3 || isNaN(gameNumber)){
                message.channel.send("Stop with this Jibber Jabber!\nYou dont make sense!\nBad Command")
            }
            //check if game exists
            if(gamesTable.File[gameNumber] == null){
                message.channel.send("This quest does not exist.\nDont waste my time with this annoyances!")
            }
            //check if editing player is game creator
            else if(!playerIsGameCreator(playerID,(gameNumber))){
                message.channel.send("You are not the one in charge of this quest!")
            }
            else{
                gamesTable.File[gameNumber].Description = desc;
                gamesTable.UpdateTable();
                message.channel.send("Now that explains that.\nDescription update Successful.");
            }
        }
        else if(msg.toLowerCase().startsWith("/signup")){
            let info = msg.split(' ')
            if(info.length!=3 || isNaN(info[2])){
                message.channel.send("Stop with this Jibber Jabber!\nYou dont make sense!\nBad Command")
            }
            if(games[info[2]] == null){
                message.channel.send("This quest does not exist.\nDont waste my time with this annoyances!")
            }
            else if(playerHasSignedUp(message.author.id,(info[2]))){
                message.channel.send("You have already enlisted to this quest!")
            }
            else if(gameIsFullyBooked(info[2])){
                message.channel.send("Ugh! Too many people!\nYou'll have to sit this one out im afraid...\nGame is fully booked")
            }
            else{
                games[info[2]].Players.push({
                    "Username" : message.author.username,
                    "UserID" : message.author.id,
                    "CharacterName" : info[1].charAt(0).toUpperCase() + info[1].slice(1)
                })
                fs.writeFile('Database/games.json', JSON.stringify(games), (err) => {
                    if(err) message.channel.send("There seems to be a problem with this request")
                })
                message.channel.send(games[info[2]].Creator+" thanks you for your willingness to help in this upcoming adventure.\nMay lady luck shine upon you.\nSignup Successful.")
            }
        }
        // else if(msg.toLowerCase().startsWith("/rc ")){

        //     //gather information
        //     let info = msg.split(' ');
        //     let characterName = info.slice(1,info.length).join(' ');
        //     characterName = characterName.charAt(0).toUpperCase() + characterName.slice(1);
        //     let playerID = message.author.id;
        //     let playerUserName = message.author.username;
        //     let newCharacterID = countersTable.File.characterCounter;

        //     //build a new player character list
        //     if(!playerCharacterListExists(playerID)){
        //         charactersTable.Write(playerID) = {
        //             "Creator" : playerUserName,
        //             "Characters" : []
        //         }
        //     }

        //     //push the new character into the player characters list
        //     charactersTable.Write(playerID).Characters.push({
        //         "CharacterName" : characterName,
        //         "Gold" : 0,
        //         "CharacterID" : newCharacterID
        //     });

        //     //push the new character into the characterByID table
        //     characterByIDTable.File[newCharacterID] = {
        //         "CharacterName" : characterName,
        //         "PlayerID" : playerID
        //     }

        //     //updating tables
        //     countersTable.File.characterCounter++;
        //     characterByIDTable.UpdateTable();
        //     charactersTable.UpdateTable();
        //     countersTable.UpdateTable();

        //     message.channel.send(`Its good meeting you ${characterName}! Your number is ${newCharacterID}`);
        // }
        // else if(msg.toLowerCase().startsWith("/gg ")){
           
        //     //get information
        //     let info = msg.split(' ');
            
        //     let characterGiverID = info[1];
        //     let playerGiverID = message.author.id;
        //     let characterReceiverID = info[2];
        //     let playerReceiverID = characterByIDTable.File[characterReceiverID].PlayerID;
        //     let gold = info[3]
            
        //     //giving gold to yourself
        //     if(playerGiverID === characterGiverID){
        //         message.channel.send('Giving gold to yourself even though its possible is just stupid.\nTransaction Successful?');
        //         return;
        //     }

        //     //giving negative gold
        //     if(gold<0){
        //         message.channel.send('You think you can outwit me fool?\nNice try...');
        //         return;
        //     }

        //     //check if character exists and belongs to the requesting player
        //     if(characterExists(characterGiverID) && characterExists(characterReceiverID) && characterBelongsToPlayer(playerGiverID, characterGiverID)){

        //         //get the player viable gold status
        //         /*
        //             what is a playerViableGoldStatus?
        //             this property holds the gold records for all of the player's characters.
        //             i later use this to see:
        //                 1) does the character the player wants to give the money from has enough gold for this transaction
        //                 2) if not, does any of his other characters have enough gold for this transaction
        //         */
        //         let playerViableGoldStatus = getPlayerViableGoldStatus(playerGiverID,characterGiverID,gold);

        //         //check to see if the Giver character is viable for the transaction
        //         if(playerViableGoldStatus['transactionPossible'] === true){

        //             //perform the transaction
        //             goldTransaction(playerGiverID, characterGiverID, playerReceiverID, characterReceiverID, gold);

        //             charactersTable.UpdateTable();

        //             message.channel.send('Transaction Successful!');
        //         }

        //         //the Giver character is not viable for the transaction
        //         //message the player and inform him about other characters he has that are viable
        //         else{

        //             //build the viable characters message string
        //             let returnMessage = '';
        //             let viableCharacters = playerViableGoldStatus['charactersViableForTheTransaction'];

        //             for(let i = 0;i<viableCharacters.length;i++){
        //                 returnMessage += `${viableCharacters[i].CharacterName}`+
        //                  ` (ID = ${viableCharacters[i].CharacterID}): ` +
        //                  `${viableCharacters[i].Gold} gp\n`
        //             }

        //             //no characters viable
        //             if(returnMessage === ''){
        //                 message.channel.send('Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n')
        //             }

        //             //some characters viable
        //             else{
        //                 message.channel.send('Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n'+
        //                 'Your other characters who can make the transaction:\n'+ returnMessage)
        //             }
        //         }
        //     }
        //     else{
        //         message.channel.send('I was\'nt able to find that Person\Beast\Ooze entity!\nCharacter not found')
        //     }

        // }
        // else if(msg.toLowerCase().startsWith("/gs")){
        //     let goldStatus = getGoldStatus(message.author.id);
        //     if(goldStatus === ''){
        //         message.channel.send("It seems that you dont have any characters.\nA shame really, guess ill have to find treasure elsewhere.\n* Flies away *\nNo characters associated to this user.") 
        //         return
        //     }
        //     message.channel.send(goldStatus) 
        // }
        // else if(msg.toLowerCase().startsWith("/agg ")){

        //     //get information
        //     let info = msg.split(' ')
        //     let characterID = info[1]
        //     let gold = info[2]
        //     let playerID = message.author.id;

        //     //check for admin permissions
        //     if(permissionsDAO.userHasAdminRights(playerID)){

        //         //check if the receiver character exists
        //         if(characterExists(characterID)){

        //             //transfer the gold
        //             addGoldToCharacter(characterByIDTable.File[characterID].PlayerID, characterID, gold);

        //             //record the transfer
        //             recordTransactionDetails('Admin', characterID, gold, countersDAO.getCounter("transactions"))

        //             //update transaction counter in the counters json
        //             countersDAO.increaseCounter("transactions");

        //             message.channel.send('The gold was delievered to the character!\n');
        //         }
        //         else{
        //             message.channel.send('I am sorry my lord, i could\'nt find the creature.\nTransfer failed.')
        //         }
        //     }
        //     else{
        //         message.channel.send('You are not powerful enough to use this command!\n');
        //     }

        // }
        // else if(msg.toLowerCase().startsWith("/pay ")){

        //     //get information
        //     let info = msg.split(' ');
        //     let characterID = info[1];
        //     let playerID = message.author.id;
        //     let gold = info[2]

        //     //giving negative gold
        //     if(gold<0){
        //         message.channel.send('Not gonna work...');
        //         return;
        //     }

        //     //check if character exists and belongs to the requesting player
        //     if(characterExists(characterID) && characterBelongsToPlayer(playerID, characterID)){

        //         //get the player viable gold status
        //         let playerViableGoldStatus = getPlayerViableGoldStatus(playerID,characterID,gold);

        //         //check to see if the Giver character is viable for the transaction
        //         if(playerViableGoldStatus['transactionPossible'] === true){

        //             //perform the transaction
        //             addGoldToCharacter(playerID, characterID, -gold)

        //             message.channel.send('Payment Received!')                        
        //         }

        //         //the Giver character is not viable for the transaction
        //         //message the player and inform him about other characters he has that are viable
        //         else{

        //             //build the viable characters message string
        //             let returnMessage = '';
        //             let viableCharacters = playerViableGoldStatus['charactersViableForTheTransaction'];

        //             for(let i = 0;i<viableCharacters.length;i++){
        //                 returnMessage += `${viableCharacters[i].CharacterName}`+
        //                  ` (ID = ${viableCharacters[i].CharacterID}): ` +
        //                  `${viableCharacters[i].Gold} gp\n`
        //             }

        //             //no characters viable
        //             if(returnMessage === ''){
        //                 message.channel.send('Your coffers are not able at the current moment to afford that purchase!\Payment failed\n')
        //             }

        //             //some characters viable
        //             else{
        //                 message.channel.send('Your coffers are not able at the current moment to afford that purchase!\Payment failed\n'+
        //                 'Your other characters who can make the payment:\n'+ returnMessage)
        //             }
        //         }
        //     }
        // }
    }

})
client.on('guildMemberAdd', member => {
    member.guild.channels.cache.get(joinServerChannel).send(`${member.user.username} the brave has joined the quest!\\nMay his path lead to wealth and not an inevitable doom.`)
    let role = member.guild.roles.find('name', 'Player')
    member.addRole(role)
})

client.login(process.env.TOKEN);



/*
on message{
    analyse message() - returns message data/message channel and relevant function

    run function() - returns info string

    message() - sends relevant output
}



const charactersDAO = (function() {
    const charactersTable = new Table(DBPaths.charactersTablePath);
    charactersTable.ReadTable();
    return {
        relevant functions
    }
})()

DAO for every table




 */
