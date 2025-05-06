const { Events } = require('discord.js');

// when the client is ready, run this code (only once)
module.exports = {
	name: Events.ClientReady,
	once: true,
	execute(client) {
		client.user.setPresence({ activities: [{name: 'Frieren: Beyond Journey\'s End'}], status: 'online' });
		console.log(`Ready! Logged in as ${client.user.tag}`);
	},
};