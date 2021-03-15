const { MessageEmbed } = require("discord.js");

exports.SendMessage = async function (channel, content, responseEmbed) {
    if (
        responseEmbed.embedNeeded !== undefined &&
        responseEmbed.embedNeeded
    ) {
        const embedToBroadcast = new MessageEmbed();
        embedToBroadcast.setTitle(responseEmbed.title);
        if (responseEmbed.color !== undefined) {
            embedToBroadcast.color = responseEmbed.color;
        }
        embedToBroadcast.setDescription(content);
        if (responseEmbed.thumbnail !== undefined) {
            embedToBroadcast.attachFiles([responseEmbed.thumbnail]);
            console.log(
                responseEmbed.thumbnail.split("/")[
                responseEmbed.thumbnail.split("/").length - 1
                ]
            );
            embedToBroadcast.setThumbnail(
                `attachment://${
                responseEmbed.thumbnail.split("/")[
                    responseEmbed.thumbnail.split("/").length - 1
                ]
                }`
            );
        }
        return await channel.send(embedToBroadcast);
    }

    if(Array.isArray(content)){
        content.forEach(async (msg) => {
            await channel.send(msg);
        });
        return;
    }
    return await channel.send(content);
},

exports.EditMessage = function (responseToEdit, editedContent) {
    responseToEdit.edit(editedContent);
},

exports.ProcessMessage = function (message) {
    console.log(`${message.author.username} said: ${message.content}`);

    const serverResponse = {
        workNeeded: false,
        responseNeeded: false,
        response: "",
        editedResponseNeeded: false,
        responseToEdit: undefined,
        channel: undefined,
        embed: {},
    };

    const prefix = process.env.PREFIX;
    const content = message.content.toLowerCase();
    const channel = message.channel;

    if (content === "hi bot" || content === "hey bot") {
        serverResponse.responseNeeded = true;
        serverResponse.response = "Hello to you as well Mortal!";
        serverResponse.channel = channel;
        return serverResponse;
    } else if (message.author.bot) {
        return serverResponse;
    } else if (content.startsWith(prefix)) {
        serverResponse.channel = channel;
        serverResponse.workNeeded = true;

        serverResponse["player"] = {
        playerID: message.author.id,
        playerUserName: message.author.username,
        };

        const splitMessage = content.split(" ");

        serverResponse["parsedMessage"] = {
        command: splitMessage[0].slice(1, splitMessage[0].length),
        variables: splitMessage.slice(1, splitMessage.length).join(" "),
        };
    }

    return serverResponse;
}