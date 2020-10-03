const JsonTable = require("../jsonTable");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const transactionsTable = new JsonTable(process.env.TRANSACTIONSTABLEPATH);
transactionsTable.ReadTable();
exports.recordTransactionDetails = function (
  characterGiverID,
  characterReceiverID,
  gold,
  transactionCounter
) {
  transactionsTable.Write(transactionCounter, {
    CharacterGiverID: characterGiverID,
    CharacterReceiverID: characterReceiverID,
    Gold: gold,
  });

  transactionsTable.UpdateTable();
};
