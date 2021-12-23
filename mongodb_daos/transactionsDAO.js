const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const { MongoClient } = require("mongodb");
const uri = process.env.MONGODB_CONNECTION_STRING;
const DBName = process.env.DB_NAME;

//get functions
exports.getTransactionByCharacterGiverID = async function (characterID) {
  const mongoClient = getMongoDBClient();
  let result;
  try {
    await mongoClient.connect();
    result = await mongoClient
      .db(DBName)
      .collection("transactions")
      .findOne({ characterGiverID: characterID });
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
    return result;
  }
};

exports.getTransactionByCharacterReceiverID = async function (characterID) {
  const mongoClient = getMongoDBClient();
  let result;
  try {
    await mongoClient.connect();
    result = await mongoClient
      .db(DBName)
      .collection("transactions")
      .findOne({ characterReceiverID: characterID });
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
    return result;
  }
};

//create functions
exports.writeTransaction = async function (
  characterGiverID,
  characterReceiverID,
  gold
) {
  const mongoClient = getMongoDBClient();
  try {
    await mongoClient.connect();
    await mongoClient
      .db(DBName)
      .collection("transactions")
      .insertOne({
        characterGiverID: characterGiverID,
        characterReceiverID: characterReceiverID,
        amount: Number(gold),
      });
  } catch (e) {
    console.error(e);
  } finally {
    await mongoClient.close();
  }
};

// exports.getAllTransactionForID = async function (ID) {
//   const mongoClient = getMongoDBClient();
//   let result;
//   try {
//     await mongoClient.connect();
//     result = await mongoClient
//       .db(DBName)
//       .collection("transactions")
//       .find({ $or: [{ characterGiverID: ID }, { characterReceiverID: ID }] });
//   } catch (e) {
//     console.error(e);
//   } finally {
//     // await mongoClient.close();
//     return result;
//   }
// };

//other functions
function getMongoDBClient() {
  return new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}
