const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')
const config = require('../../config.json');
const fs = require('fs');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('animelist')
        .setDescription('Gets the specified user\'s anime list.')
        .addStringOption(option =>
            option.setName('username')
                .setDescription('The MAL user to find')
                .setRequired(true)
            )
        .addStringOption(option =>
            option.setName('status')
                .setDescription('Filter by status')
                .setRequired(false)
                .addChoices(
                    { name: 'watching', value: 'watching' },
                    { name: 'completed', value: 'completed' },
                    { name: 'on_hold', value: 'on_hold' },
                    { name: 'dropped', value: 'dropped' },
                    { name: 'plan_to_watch', value: 'plan_to_watch' }
                )
            )
        .addStringOption(option =>
            option.setName('sort')
                .setDescription('Sort by')
                .setRequired(false)
                .addChoices(
                    { name: 'score', value: 'list_score' },
                    { name: 'time', value: 'list_updated_at' },
                    { name: 'anime start date', value: 'anime_start_date' }
                )
            ),
    async execute(interaction) {
        try {
            const username = interaction.options.getString('username');
            const status = interaction.options.getString('status');
            const sort = interaction.options.getString('sort') || 'list_updated_at';
            const uid = String(interaction.user.id);
            let nonExistent = false;
            let isError = false;
            
            fs.readFile('./access_tokens.json', 'utf8', async (err, data) => {
                if (err) {
                    isError = true;
                    return;
                }
                try {
                    const tokens = JSON.parse(data);
                    if (!(uid in tokens)) {
                        nonExistent = true;
                        return;
                    }

                    const response = await fetch(`https://api.myanimelist.net/v2/users/${username}/animelist?fields=list_status&sort=${sort}${status ? `&status=${status}` : ''}&limit=20`, {
                        headers: {
                            'Authorization': `Bearer ${tokens[uid]}`,
                        }
                    });
                    
                    if (!response.ok) {
                        console.log(response.status);
                        await interaction.reply({ content: 'Please log into MyAnimeList with /login.', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    const dt = await response.json();
                    if (dt.status === 403 || dt.status === 401) {
                        await interaction.reply({ content: 'Please log into MyAnimeList with /login.', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    if (!dt.data) {
                        await interaction.reply({ content: 'This user doesn\'t exist!', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    const results = dt.data;
                    const embeds = [];

                    if (results.length === 0) {
                        await interaction.reply({ content: 'This user has no anime in their list!', flags: MessageFlags.Ephemeral });
                        return;
                    }

                    const reply = await interaction.deferReply();

                    let i = 1;
                    for (const result of results) {
                        const embed = new EmbedBuilder()
                            .setColor(0xff99dd)
                            .setTitle(`${result.node.title ?? 'No Title'}`)
                            .setFields(
                                { name: 'ID', value: `${result.node.id ?? 'No ID'}`, inline: true }, 
                                { name: 'Status', value: `${result.list_status.status ?? 'No Status'}`, inline: true }, 
                                { name: 'Episodes Watched', value: `${result.list_status.num_episodes_watched}`, inline: true }, 
                                { name: 'Score', value: `${result.list_status.score ?? 'Not Scored'}`, inline: true },
                                { name: 'Rewatching', value: `${result.list_status.is_rewatching}`, inline: true },
                                { name: 'Update Date', value: `${result.list_status.updated_at.substring(0, result.list_status.updated_at.indexOf('T'))}`, inline: true },
                            )
                            .setImage(`${result.node.main_picture.medium ?? ''}`)
                            .setTimestamp()
                            .setFooter({ text: `${username}'s Anime List  •  Page ${i} of ${results.length}` });
                        embeds.push(embed);
                        i++;
                    }

                    const prevButton = new ButtonBuilder()
                        .setCustomId(`prev-${interaction.user.id}`)
                        .setLabel('←')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true);

                    const nextButton = new ButtonBuilder()
                        .setCustomId(`next-${interaction.user.id}`)
                        .setLabel('→')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(embeds.length === 1);

                    const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

                    let currentPage = 0;

                    await interaction.editReply({ embeds: [embeds[currentPage]], components: [row] });

                    const collector = reply.createMessageComponentCollector({
                        filter: i => i.customId === `prev-${interaction.user.id}` || i.customId === `next-${interaction.user.id}`,
                        time: 300000,
                    });

                    collector.on('collect', async i => {
                        if (i.customId === `prev-${i.user.id}`) {
                            currentPage--;
                        } else if (i.customId === `next-${i.user.id}`) {
                            currentPage++;
                        }

                        prevButton.setDisabled(currentPage === 0);
                        nextButton.setDisabled(currentPage === embeds.length - 1);

                        await i.update({ embeds: [embeds[currentPage]], components: [row] });
                    });
                } catch (error) {
                    isError = true;
                    return;
                }
            });

            if (isError) {
                await interaction.reply({ content: 'An error occurred while accessing your tokens. Please try again later.', flags: MessageFlags.Ephemeral });
                return;
            }

            if (nonExistent) {
                await interaction.reply({ content: 'You need to link your MyAnimeList account first using /login.', flags: MessageFlags.Ephemeral });
                return;
            }            
        } catch (error) {
            await interaction.editReply({ content: 'An error occurred! (Most likely API rate limit)', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};