function commandRoll(str){
    let messageRegex = new RegExp('([0-9]+)d([0-9]+)(\\+([0-9]+))*', 'g')
    let messageRegexResult = str.toLowerCase().match(messageRegex);
    if(messageRegexResult!=null && messageRegexResult[0]===str.toLowerCase()){
        console.log("valid")
        const values = {
            rolls:[],
            modifires:0,
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
            modifiersRegexResult.forEach(element2 => {
                values.modifires = values.modifires + parseInt(element2)
                values.sum = values.sum + parseInt(element2)
            });
        }
        console.log(values)
        return values
    }
    else{
        return null
    }
}
