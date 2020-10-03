const JsonTable = require("../jsonTable");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const permissionsTable = new JsonTable(DBPaths.permissionsTablePath);
permissionsTable.ReadTable();
exports.userHasAdminRights = function (playerID) {
  if (permissionsTable.Read("admin").find((element) => element == playerID)) {
    return true;
  }
  return false;
};
