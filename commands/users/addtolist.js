const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
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
                    
                    const command = 
                        `curl "https://api.myanimelist.net/v2/anime/${animeId}/my_list_status" --request PUT -d status=${status}${score ? ` -d score=${score}` : ''}${episodesWatched ? ` -d num_watched_episodes=${episodesWatched}` : ''} -H "Authorization: Bearer ${token}"`
                    
                    let loggedIn = true;
                    
                    exec(command, { encoding: 'utf-8' }, (error, stdout, stderr) => {
                        if (error !== null) {
                            console.error(error);
                            loggedIn = false;
                            return;
                        }
                    });

                    if (!loggedIn) {
                        interaction.reply({ content: 'Please log in using /login.', flags: MessageFlags.Ephemeral });
                    }

                    const reply = await interaction.deferReply();

                    const embed = new EmbedBuilder()
                        .setColor(0xff99dd)
                        .setDescription(`Successfully updated your list! Use /mylist to view your updated list.`);

                    await interaction.editReply({ embeds: [embed] });
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