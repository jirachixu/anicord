const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anime')
        .setDescription('Searches for the anime specified.')
        .addStringOption(option => 
            option.setName('anime')
                .setDescription('The anime to find'))
        .addIntegerOption(option => 
            option.setName('limit')
                .setDescription('How many matches to show (default is 10)')
        ),
    async execute(interaction) {
        try {
            const anime = interaction.options.getString('anime');
            const limit = interaction.options.getInteger('limit') ?? 10;
            let results = [];
            let embeds = [];

            if (!anime || !anime.trim()) {
                await interaction.reply({ 
                    content: 'You must specify an anime to find!',
                    flags: MessageFlags.Ephemeral
                });
                return
            }

            const response = await fetch(`https://api.myanimelist.net/v2/anime?q=${anime}&limit=${limit}`, {
                headers: {
                    'X-MAL-CLIENT-ID': '46f84287b4f624e8fc1024ed1736bcc9'
                }
            });
            
            if (!response.ok) {
                throw new Error('Could not fetch resource.');
            }

            const data = await response.json();

            for (const node of data.data) {
                const id = node.node.id
                const anime = await fetch(`https://api.myanimelist.net/v2/anime/${id}?fields=id,title,main_picture,alternative_titles,start_date,end_date,synopsis,mean,rank,popularity,num_list_users,num_scoring_users,nsfw,created_at,updated_at,media_type,status,genres,my_list_status,num_episodes,start_season,broadcast,source,average_episode_duration,rating,pictures,background,related_anime,related_manga,recommendations,studios,statistics`, {
                    headers: {
                        'X-MAL-CLIENT-ID': '46f84287b4f624e8fc1024ed1736bcc9'
                    }
                });
                const result = await anime.json();
                results.push(result);
            }

            let i = 1;
            for (const result of results) {
                let genres = '';

                for (const genre of result.genres) {
                    genres = genres + genre.name + ', '
                }

                genres = genres.substring(0, genres.length - 2)

                const embed = new EmbedBuilder()
                    .setColor(0xff99dd)
                    .setTitle(`${result.title}`)
                    .setDescription(`${result.synopsis}`)
                    .setFields(
                        { name: 'Rating', value: `${result.mean ?? 'No Rating'}`, inline: true }, 
                        { name: 'Start Date', value: `${result.start_date ?? 'No start date set'}`, inline: true }, 
                        { name: 'End Date', value: `${result.end_date ?? 'Not finished airing'}`, inline: true}, 
                        { name: 'Episodes', value: `${result.num_episodes}`, inline: true },  
                        { name: 'Genres', value: `${genres}`, inline: true }
                    )
                    .setImage(`${result.main_picture.medium}`)
                    .setTimestamp()
                    .setFooter({ text: `Page ${i} of ${results.length}` });
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
            const reply = await interaction.reply({ embeds: [embeds[currentPage]], components: [row] });

            const collector = reply.createMessageComponentCollector({
                filter: i => i.customId === `prev-${interaction.user.id}` || i.customId === `next-${interaction.user.id}`,
                time: 60000,
            });

            collector.on('collect', async i => {
                if (i.customId === `prev-${interaction.user.id}`) {
                    currentPage--;
                } else if (i.customId === `next-${interaction.user.id}`) {
                    currentPage++;
                }

                prevButton.setDisabled(currentPage === 0);
                nextButton.setDisabled(currentPage === embeds.length - 1);

                await i.update({ embeds: [embeds[currentPage]], components: [row] });
            })
        } catch (error) {
            console.error(error);
        }
    },
};