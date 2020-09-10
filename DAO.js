const fs = require('fs')

class Table {
    constructor(path) {
        this.Path = path;
        this.File = undefined;
    }
}

Table.prototype.ReadTable = function() {
    this.File = JSON.parse(fs.readFileSync(this.Path, 'utf8'));
}

Table.prototype.UpdateTable = function() {
    fs.writeFile(this.Path, JSON.stringify(this.File), (err) => {
        if(err) message.channel.send("There seems to be a problem with this request")
    })
}

Table.prototype.Write = function(key, value) {
    this.File[key] = value;
}

Table.prototype.Read = function(key) {
    return this.File[key];
}

Table.prototype.Delete = function(key) {
    delete this.File[key];
}

module.exports = Table;