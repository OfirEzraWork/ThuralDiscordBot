const { Client } = require("discord.js");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const MessageController = require("./controllers/messageController.js");

const facadeController = require("./controllers/facadeController.js");

const joinServerChannel = process.env.NEWPLAYERCHANNEL;

const client = new Client({
  disableEveryone: true,
});

client.on("ready", () => {
  console.log("The Dragon has awaken!");

  client.user.setStatus("online");
  client.user.setActivity("Dungeons and Dragons", {
    type: "PLAYING",
  });
});
client.on("message", async (message) => {
  facadeController.IncomingMessage(message);
});
client.on("guildMemberAdd", (member) => {
  console.log("a player has joined the server");
  member.guild.channels.cache
    .get(joinServerChannel)
    .send(
      `${member.user.username} the brave has joined the quest!\\nMay his path lead to wealth and not an inevitable doom.`
    );
  let role = member.guild.roles.find("name", "Player");
  member.addRole(role);
});

client.login(process.env.TOKEN);
