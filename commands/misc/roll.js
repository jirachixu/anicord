const { SlashCommandBuilder, MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roll')
        .setDescription('Rolls a die with a specified number of faces (default is 6)')
        .addIntegerOption(option =>
            option.setName('faces')
                .setDescription('the number of faces of the die')
                .setChoices(
                    { name: '4', value: 4 }, 
                    { name: '6', value: 6 }, 
                    { name: '8', value: 8 }, 
                    { name: '12', value: 12 }, 
                    { name: '20', value: 20 }
                )
        ),
    async execute(interaction) {
        const faces = interaction.options.getInteger('faces') ?? 6;
        await interaction.reply({ content: `Result for a die with ${faces} faces: ${Math.floor(Math.random() * faces + 1)}` });
    },
};