const { Client } = require("discord.js");

const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const facadeController = require("./controllers/facadeController.js");

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

client.login(process.env.TOKEN);
