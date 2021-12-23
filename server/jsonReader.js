const fs = require("fs");

class JsonReader {
  constructor(path) {
    this.Path = path;
    this.File = JSON.parse(fs.readFileSync(this.Path, "utf8"));
  }

  Read(key) {
    return this.File[key];
  }
}

module.exports = JsonReader;
