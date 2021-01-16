const JsonTable = require("../jsonTable");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const countersTable = new JsonTable(process.env.COUNTERSTABLEPATH);
countersTable.ReadTable();

exports.getCounter = function (key) {
  return countersTable.Read(key);
};
exports.increaseCounter = function (key) {
  countersTable.Write(key, countersTable.Read(key) + 1);
  countersTable.UpdateTable();
};
