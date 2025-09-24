const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the server.'),
	async execute(interaction) {
		try {
			// interaction.guild is the object representing the Guild in which the command was run
			await interaction.reply(`This server is ${interaction.guild.name} and has ${interaction.guild.memberCount} members.`);
		} catch (error) {
			await interaction.reply({ content: 'An error occurred! Make sure you\'re not running this command in a DM!', flags: MessageFlags.Ephemeral });
		}
	},
};