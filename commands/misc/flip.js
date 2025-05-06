const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flip')
        .setDescription('Flip a coin'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor(0xff99dd)
            .setFields(
                { name: 'Result', value: `${Math.random() < 0.5 ? 'Heads!' : 'Tails!'}` }
            );
        await interaction.reply({ embeds: [embed] });
    },
};