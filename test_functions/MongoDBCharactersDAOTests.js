const testFunction1 = async function () {
  const testCharactersDAO = require("./mongodb_daos/charactersDAO.js");

  console.log("********* Start TESTS *********");
  //test getPlayerCharacterList
  let result = await testCharactersDAO.getPlayerCharacterList(
    "213282396504719360"
  );
  console.log("test getPlayerCharacterList:");
  console.log(result);

  //test getActiveCharacter
  result = await testCharactersDAO.getActiveCharacter("213282396504719360");
  console.log("test getActiveCharacter:");
  console.log(result);

  //test getCharacterGold
  result = await testCharactersDAO.getCharacterGold("213282396504719360", "4");
  console.log("test getCharacterGold:");
  console.log(result);
  let temp = result;

  //test addGoldToCharacter
  await testCharactersDAO.addGoldToCharacter("213282396504719360", "4", "1");
  console.log("test addGoldToCharacter:");
  result = await testCharactersDAO.getCharacterGold("213282396504719360", "4");
  console.log(result);
  console.log(result > temp);

  //test createCharacterList
  await testCharactersDAO.createCharacterList("1", "Test");
  console.log("test createCharacterList:");
  result = await testCharactersDAO.getPlayerCharacterList("1");
  if (result) {
    console.log("character list found");
  } else {
    console.log("character list wasn't found");
  }

  //test writeNewCharacter
  await testCharactersDAO.writeNewCharacter("1", "Torgar", 999, true);
  console.log("test writeNewCharacter:");
  result = await testCharactersDAO.getPlayerCharacterList("1");
  if (result.length > 0) {
    console.log("non empty character list");
  } else {
    console.log("empty character list");
  }

  //test changeActiveCharacter
  await testCharactersDAO.writeNewCharacter("1", "Torgar Jr.", 900, false);
  await testCharactersDAO.changeActiveCharacter("1", 999, 900);
  result = await testCharactersDAO.getActiveCharacter("1");
  if (result.CharacterID === 900) {
    console.log("correct active character");
  } else {
    console.log("incrrect active character");
  }
  console.log(result);

  console.log("********* END TESTS *********");
};
