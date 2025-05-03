const { SlashCommandBuilder, MessageFlags } = require("discord.js");

// Definition and functionality of ping command
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Gets your latency in milliseconds!'),
    async execute(interaction) {
        await interaction.reply({ content: `Latency is ${Date.now() - interaction.createdTimestamp} ms!`, flags: MessageFlags.Ephemeral });
    },
};