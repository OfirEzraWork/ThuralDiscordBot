class ServerResponse {
  constructor() {
    this.workNeeded = false;
    this.responseNeeded = false;
    this.response = "";
    this.editedResponseNeeded = false;
    this.responseToEdit = undefined;
    this.channel = undefined;
    this.embed = {};
  }
}

module.exports = ServerResponse;
