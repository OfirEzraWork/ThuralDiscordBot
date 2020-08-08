const { Client } = require("discord.js");

const { config } = require("dotenv");

const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

const fs = require('fs')

const Table = function(path){
    this.Path = path;
    this.File = undefined;
}

Table.prototype.ReadTable =  function() {
    this.File = JSON.parse(fs.readFileSync(this.Path, 'utf8'));
}

Table.prototype.UpdateTable = function() {
    fs.writeFile(this.Path, JSON.stringify(this.File), (err) => {
        if(err) message.channel.send("There seems to be a problem with this request")
    })
}

const gamesTable = new Table('Database/games.json');
gamesTable.ReadTable();

const countersTable = new Table('Database/counters.json');
countersTable.ReadTable();

const charactersTable = new Table('Database/characters.json');
charactersTable.ReadTable();

const characterByIDTable = new Table('Database/characterByID.json');
characterByIDTable.ReadTable();

const transactionsTable = new Table('Database/transactions.json');
transactionsTable.ReadTable();

const permissions = JSON.parse(fs.readFileSync('Database/permissions.json', 'utf8'))

const adminList = permissions['admin'];

const joinServerChannel = 698859489100824576

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
    console.log(`${message.author.username} said: ${message.content}`)
    let prefix = '/'
    let msg = message.content
    if(msg.toLowerCase() == "hi bot" || msg.toLowerCase() == "hey bot"){
        message.channel.send("Hello to you as well Mortal!")
        return
    }
    if(!message.content.startsWith(prefix)|message.author.bot){
        return
    }
    else if(message.content.startsWith(prefix)){
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
            "Make a payment - /pay [YourCharacterID] [Amount]\n"+
            "Transfer gold to another character - /gg [YourCharacterID] [ReceivingCharacterID] [Amount]\n")
        }
        else if(msg.toLowerCase().startsWith("/roll")){
            message.channel.send(commandRollStringBuilder(commandRoll(message.content.slice(6))))
        }
        else if(msg.toLowerCase().startsWith("/spell")){
            const reply = await message.channel.send("Searching the great library...")
            let result = await getSpell(message.content.slice(7))
            reply.edit(getSpellStringBuilder(result))
        }
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
        else if(msg.toLowerCase().startsWith("/rc ")){

            //gather information
            let info = msg.split(' ');
            let characterName = info.slice(1,info.length).join(' ');
            characterName = characterName.charAt(0).toUpperCase() + characterName.slice(1);
            let playerID = message.author.id;
            let playerUserName = message.author.username;
            let newCharacterID = countersTable.File.characterCounter;

            //build a new player character list
            if(!playerCharacterListExists(playerID)){
                charactersTable.File[playerID] = {
                    "Creator" : playerUserName,
                    "Characters" : []
                }
            }

            //push the new character into the player characters list
            charactersTable.File[playerID].Characters.push({
                "CharacterName" : characterName,
                "Gold" : 0,
                "CharacterID" : newCharacterID
            })

            //push the new character into the characterByID table
            characterByIDTable.File[newCharacterID] = {
                "CharacterName" : characterName,
                "PlayerID" : playerID
            }

            //updating tables
            countersTable.File.characterCounter++;
            characterByIDTable.UpdateTable();
            charactersTable.UpdateTable();
            countersTable.UpdateTable();

            message.channel.send(`Its good meeting you ${characterName}! Your number is ${newCharacterID}`);
        }
        else if(msg.toLowerCase().startsWith("/gg ")){
           
            //get information
            let info = msg.split(' ');
            
            let characterGiverID = info[1];
            let playerGiverID = message.author.id;
            let characterReceiverID = info[2];
            let playerReceiverID = characterByIDTable.File[characterReceiverID].PlayerID;
            let gold = info[3]
            
            //giving gold to yourself
            if(playerGiverID === characterGiverID){
                message.channel.send('Giving gold to yourself even though its possible is just stupid.\nTransaction Successful?');
                return;
            }

            //giving negative gold
            if(gold<0){
                message.channel.send('You think you can outwit me fool?\nNice try...');
                return;
            }

            //check if character exists and belongs to the requesting player
            if(characterExists(characterGiverID) && characterExists(characterReceiverID) && characterBelongsToPlayer(playerGiverID, characterGiverID)){

                //get the player viable gold status
                /*
                    what is a playerViableGoldStatus?
                    this property holds the gold records for all of the player's characters.
                    i later use this to see:
                        1) does the character the player wants to give the money from has enough gold for this transaction
                        2) if not, does any of his other characters have enough gold for this transaction
                */
                let playerViableGoldStatus = getPlayerViableGoldStatus(playerGiverID,characterGiverID,gold);

                //check to see if the Giver character is viable for the transaction
                if(playerViableGoldStatus['transactionPossible'] === true){

                    //perform the transaction
                    goldTransaction(playerGiverID, characterGiverID, playerReceiverID, characterReceiverID, gold);

                    charactersTable.UpdateTable();

                    message.channel.send('Transaction Successful!');
                }

                //the Giver character is not viable for the transaction
                //message the player and inform him about other characters he has that are viable
                else{

                    //build the viable characters message string
                    let returnMessage = '';
                    let viableCharacters = playerViableGoldStatus['charactersViableForTheTransaction'];

                    for(let i = 0;i<viableCharacters.length;i++){
                        returnMessage += `${viableCharacters[i].CharacterName}`+
                         ` (ID = ${viableCharacters[i].CharacterID}): ` +
                         `${viableCharacters[i].Gold} gp\n`
                    }

                    //no characters viable
                    if(returnMessage === ''){
                        message.channel.send('Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n')
                    }

                    //some characters viable
                    else{
                        message.channel.send('Your coffers are not able at the current moment to afford that transaction!\nTransaction failed\n'+
                        'Your other characters who can make the transaction:\n'+ returnMessage)
                    }
                }
            }
            else{
                message.channel.send('I was\'nt able to find that Person\Beast\Ooze entity!\nCharacter not found')
            }

        }
        else if(msg.toLowerCase().startsWith("/gs")){
            let goldStatus = getGoldStatus(message.author.id);
            if(goldStatus === ''){
                message.channel.send("It seems that you dont have any characters.\nA shame really, guess ill have to find treasure elsewhere.\n* Flies away *\nNo characters associated to this user.") 
                return
            }
            message.channel.send(goldStatus) 
        }
        else if(msg.toLowerCase().startsWith("/agg ")){

            //get information
            let info = msg.split(' ')
            let characterID = info[1]
            let gold = info[2]
            let playerID = message.author.id;

            //check for admin permissions
            if(adminList.find(element => element == playerID)){

                //check if the receiver character exists
                if(characterExists(characterID)){

                    //transfer the gold
                    addGoldToCharacter(characterByIDTable.File[characterID].PlayerID, characterID, gold);

                    //record the transfer
                    recordTransactionDetails('Admin', characterID, gold)

                    message.channel.send('The gold was delievered to the character!\n');
                }
                else{
                    message.channel.send('I am sorry my lord, i could\'nt find the creature.\nTransfer failed.')
                }
            }
            else{
                message.channel.send('You are not powerful enough to use this command!\n');
            }

        }
        else if(msg.toLowerCase().startsWith("/pay ")){

            //get information
            let info = msg.split(' ');
            let characterID = info[1];
            let playerID = message.author.id;
            let gold = info[2]

            //giving negative gold
            if(gold<0){
                message.channel.send('Not gonna work...');
                return;
            }

            //check if character exists and belongs to the requesting player
            if(characterExists(characterID) && characterBelongsToPlayer(playerID, characterID)){

                //get the player viable gold status
                let playerViableGoldStatus = getPlayerViableGoldStatus(playerID,characterID,gold);

                //check to see if the Giver character is viable for the transaction
                if(playerViableGoldStatus['transactionPossible'] === true){

                    //perform the transaction
                    addGoldToCharacter(playerID, characterID, -gold)

                    message.channel.send('Payment Received!')                        
                }

                //the Giver character is not viable for the transaction
                //message the player and inform him about other characters he has that are viable
                else{

                    //build the viable characters message string
                    let returnMessage = '';
                    let viableCharacters = playerViableGoldStatus['charactersViableForTheTransaction'];

                    for(let i = 0;i<viableCharacters.length;i++){
                        returnMessage += `${viableCharacters[i].CharacterName}`+
                         ` (ID = ${viableCharacters[i].CharacterID}): ` +
                         `${viableCharacters[i].Gold} gp\n`
                    }

                    //no characters viable
                    if(returnMessage === ''){
                        message.channel.send('Your coffers are not able at the current moment to afford that purchase!\Payment failed\n')
                    }

                    //some characters viable
                    else{
                        message.channel.send('Your coffers are not able at the current moment to afford that purchase!\Payment failed\n'+
                        'Your other characters who can make the payment:\n'+ returnMessage)
                    }
                }
            }
        }
    }

})
client.on('guildMemberAdd', member => {
    member.guild.channels.cache.get(joinServerChannel).send(`${member.user.username} the brave has joined the quest!\\nMay his path lead to wealth and not an inevitable doom.`)
    let role = member.guild.roles.find('name', 'Player')
    member.addRole(role)
})

client.login(process.env.TOKEN);

function commandRoll(str){
    let messageRegex = new RegExp('([0-9]+)d([0-9]+)(\\+([0-9]+))*', 'g')
    let messageRegexResult = str.toLowerCase().match(messageRegex);
    if(messageRegexResult!=null && messageRegexResult[0]===str.toLowerCase()){
        console.log("valid")
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
        console.log(values)
        return values
    }
    else{
        return null
    }
}
function commandRollStringBuilder(result){
    if(result!==null){
        let returnMessage = (`Total: ${result.sum}\n`)
        result.rolls.forEach(element => {
            returnMessage = returnMessage+`${element}, `
        });
        returnMessage = returnMessage.substring(0,returnMessage.length-2)
        returnMessage = returnMessage+(`\nWith a +${result.modifires} modifier`)
        return returnMessage
    }
    else{
        return "You roll dice wrong.\nFoolish Human!"
    }
}
async function getSpell(str){
    return new Promise(function (resolve, reject){
        str = str.split(" ").join("-")
        console.log(str)
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
    })
}
function getSpellStringBuilder(result){
    if(result!==null){
        let returnMessage = (`${result.name}\n`)

        //Level, School, Ritual
        returnMessage = returnMessage + (`Level ${result.level} ${result.school.name}`)
        if(result.ritual){
            returnMessage = returnMessage.concat(` (ritual)\n`)
        }
        else{
            returnMessage = returnMessage.concat(`\n`)
        }
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
            returnMessage = returnMessage+` (${result.material})\n`
        }
        else{
            returnMessage = returnMessage+`\n`
        }
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
}
function playerHasSignedUp(userID,gameNumber){
    let check = false;
    gamesTable.File[gameNumber].Players.forEach((player) => {
        if(player.UserID === userID){
            check = true;
        }
    })
    return check;
}
function gameIsFullyBooked(gameNumber){
    if(gamesTable.File[gameNumber].Players.length == games['maxPlayers']){
        return true
    }
    return false;
}
function playerIsGameCreator(userID ,gameNumber){
    if(gamesTable.File[gameNumber].CreatorID == userID){
        return true
    }
    return false;
}
function playerCharacterListExists(playerID){
    if(charactersTable.File[playerID] !== undefined){
        return true;
    }
    return false;
}
function characterBelongsToPlayer (playerGiverID, characterGiverID){
    if(characterByIDTable.File[characterGiverID].PlayerID === playerGiverID){
        return true;
    }
    return false;
}
function characterExists(characterID){
    if(characterByIDTable.File[characterID] !== undefined){
        return true;
    }
    return false;
}
function getPlayerViableGoldStatus (playerGiverID, characterGiverID, gold){
    
    //get the player list of characters
    let givingPlayerCharacters = charactersTable.File[playerGiverID].Characters;

    //start building the gold status object
    let playerViableGoldStatus = {};
    playerViableGoldStatus['playerGiverID'] = playerGiverID;
    playerViableGoldStatus['characterGiverID'] = characterGiverID;
    playerViableGoldStatus['charactersViableForTheTransaction'] = []

    //iterate on the player list and add characters viable for the transaction
    for(let i = 0; i<givingPlayerCharacters.length;i++){
        if (givingPlayerCharacters[i].Gold >= gold){
            
            //if the character the player requested the gold from has enough gold
            if(givingPlayerCharacters[i].CharacterID == characterGiverID){
                playerViableGoldStatus['transactionPossible'] = true;
            }

            //if another one of the player characters has enough gold, add him to viable list
            else{
                playerViableGoldStatus['charactersViableForTheTransaction'].push({
                    "CharacterName" : givingPlayerCharacters[i].CharacterName,
                    "Gold" : givingPlayerCharacters[i].Gold,
                    "CharacterID" : givingPlayerCharacters[i].CharacterID
                })
            }
        }
    }
    return playerViableGoldStatus;
}
function goldTransaction(playerGiverID, characterGiverID, playerReceiverID, characterReceiverID, gold){

    //reduce from giver
    addGoldToCharacter(playerGiverID, characterGiverID, -gold)

    //increase receiver
    addGoldToCharacter(playerReceiverID, characterReceiverID, gold)
    
    //record the transaction in the transactions json
    recordTransactionDetails(characterGiverID, characterReceiverID, gold)

}
function getGoldStatus(playerID){
    let status = '';
    let playerCharacters = charactersTable.File[playerID].Characters;
    playerCharacters.forEach((character) => {
        status += `${character.CharacterName} (ID = ${character.CharacterID}): ${character.Gold} gp\n`;
    })
    return status
}
function addGoldToCharacter(playerID, characterID, gold){

    //get the player characters
    let playerCharacters = charactersTable.File[playerID].Characters;

    //find the character to act on
    for(let i = 0; i<playerCharacters.length;i++){
        if(playerCharacters[i].CharacterID == characterID){

            //add/reduce the gold on the character
            charactersTable.File[playerID].Characters[i].Gold += Number(gold);
            charactersTable.UpdateTable();       
            return true
        }
    }
}
function recordTransactionDetails(characterGiverID, characterReceiverID, gold){
    
    //add transaction to the transaction json
    transactionsTable.File[countersTable.File.transactions] = {
        "CharacterGiverID" : characterGiverID,
        "CharacterReceiverID" : characterReceiverID,
        "Gold" : gold
    }

    //update transaction counter in the counters json
    countersTable.File.transactions++;

    //update tables
    transactionsTable.UpdateTable();
    countersTable.UpdateTable();
}
