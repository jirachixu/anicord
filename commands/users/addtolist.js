const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, Message } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addtolist')
        .setDescription('Adds or updates the specified anime in your list.')
        .addIntegerOption(option => 
            option.setName('animeid')
                .setDescription('The ID of the anime to add or update')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('status')
                .setDescription('The status to set for the anime')
                .setRequired(true)
                .addChoices(
                    { name: 'watching', value: 'watching' },
                    { name: 'completed', value: 'completed' },
                    { name: 'on_hold', value: 'on_hold' },
                    { name: 'dropped', value: 'dropped' },
                    { name: 'plan_to_watch', value: 'plan_to_watch' }
                )
            )
        .addIntegerOption(option =>
            option.setName('score')
                .setDescription('The score to give the anime (1-10)')
                .setRequired(false)
            )
        .addIntegerOption(option => 
            option.setName('episodes_watched')
                .setDescription('The number of episodes you have watched')
                .setRequired(false)
            ),
    async execute(interaction) {
        try {
            const animeId = interaction.options.getInteger('animeid');
            const status = interaction.options.getString('status');
            const score = interaction.options.getInteger('score');
            const episodesWatched = interaction.options.getInteger('episodes_watched');

            fs.readFile('./access_tokens.json', 'utf8', async (err, data) => {
                if (err) {
                    await interaction.reply({ content: 'An error occurred!', flags: MessageFlags.Ephemeral });
                    return;
                }
                try {
                    const tokens = JSON.parse(data);
                    const uid = String(interaction.user.id);

                    if (!(uid in tokens)) {
                        await interaction.reply({ content: 'You need to log in first using /login!', flags: MessageFlags.Ephemeral });
                        return;
                    }
                    const token = tokens[uid];

                    const body = new URLSearchParams({ 'status': `${status}` });
                    score && body.append('score', `${score}`);
                    episodesWatched && body.append('num_watched_episodes', `${episodesWatched}`);
                    
                    const response = await fetch(`https://api.myanimelist.net/v2/anime/${animeId}/my_list_status`, {
                                                    method: 'PUT',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`
                                                    },
                                                    body: body
                                                });

                    if (!response.ok) {
                        await interaction.reply({ content: 'Please log into MyAnimeList using /login.', flags: MessageFlags.Ephemeral });
                    }

                    const reply = await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const embed = new EmbedBuilder()
                        .setColor(0xff99dd)
                        .setDescription(`Successfully updated your list! Use /mylist to view your updated list.`)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed], flags: MessageFlags.Ephemeral });
                } catch (error) {
                    interaction.reply({ content: 'An error occurred!', flags: MessageFlags.Ephemeral });
                    console.error(error);
                }
            });
        } catch (error) {
            await interaction.editReply({ content: 'An error occurred! Make sure your episode count is correct.', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};