const fs = require("fs");

class JsonTable {
  constructor(path) {
    this.Path = path;
    this.File = undefined;
  }
}

JsonTable.prototype.ReadTable = function () {
  this.File = JSON.parse(fs.readFileSync(this.Path, "utf8"));
};

JsonTable.prototype.UpdateTable = function () {
  fs.writeFile(this.Path, JSON.stringify(this.File), (err) => {
    if (err)
      message.channel.send("There seems to be a problem with this request");
  });
};

JsonTable.prototype.Write = function (key, value) {
  this.File[key] = value;
};

JsonTable.prototype.Read = function (key) {
  return this.File[key];
};

JsonTable.prototype.ReadAllWhere = function (key, value) {
  const filteredItems = {};
  for (let index in this.File) {
    if (this.File[index][key] === value) {
      filteredItems[index] = this.File[index];
    }
  }
  return filteredItems;
};

JsonTable.prototype.Delete = function (key) {
  delete this.File[key];
};

module.exports = JsonTable;
