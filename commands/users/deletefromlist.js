const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletefromlist')
        .setDescription('Deletes the specified anime from your list.')
        .addIntegerOption(option => 
            option.setName('animeid')
                .setDescription('The ID of the anime to delete')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            const animeId = interaction.options.getInteger('animeid');

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
                    
                    const response = await fetch(`https://api.myanimelist.net/v2/anime/${animeId}/my_list_status`, {
                                                method: 'DELETE',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`
                                                }
                                            });

                    if (response.status === 404) {
                        await interaction.reply({ content: 'The anime is not in your list!', flags: MessageFlags.Ephemeral });
                    } else if (!response.ok) {
                        await interaction.reply({ content: 'Please log into MyAnimeList using /login.', flags: MessageFlags.Ephemeral });
                    }

                    const reply = await interaction.deferReply({ flags: MessageFlags.Ephemeral });

                    const embed = new EmbedBuilder()
                        .setColor(0xff99dd)
                        .setDescription(`Successfully deleted from your list! Use /mylist to view your updated list.`)
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