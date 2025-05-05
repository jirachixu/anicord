const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Flip a coin'),
    async execute(interaction) {
        await interaction.reply({ content: `${Math.random() < 0.5 ? 'Heads!' : 'Tails!'}` });
    },
};