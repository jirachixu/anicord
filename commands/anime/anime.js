const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('anime')
        .setDescription('Searches for the anime specified.')
        .addStringOption(option => 
            option.setName('anime')
                .setDescription('The anime to find')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('limit')
                .setDescription('How many matches to show (default is 5, max is 20)'))
        .addStringOption(option => 
            option.setName('order')
                .setDescription('How to order the results (default is popularity)')
                .setChoices(
                    { name: 'MAL ID', value: 'mal_id' },
                    { name: 'title', value: 'title' },
                    { name: 'start date', value: 'start_date' }, 
                    { name: 'score', value: 'score' }, 
                    { name: 'popularity', value: 'popularity' }
                )
        ),
    async execute(interaction) {
        try {
            const anime = interaction.options.getString('anime');
            const limit = interaction.options.getInteger('limit') ?? 5;
            const order_by = interaction.options.getString('order') ?? 'popularity';
            let results = [];
            let embeds = [];

            if (limit > 20 || limit < 1) {
                await interaction.reply({
                    content: 'Limit must be between 1 and 20!',
                    flags: MessageFlags.Ephemeral
                })
                return;
            }

            const reply = await interaction.deferReply();

            const response = await fetch(`https://api.jikan.moe/v4/anime?limit=${limit}&q=${anime}&order_by=${order_by}`);
            
            if (!response.ok) {
                throw new Error('Could not fetch resource.');
            }

            const data = await response.json();

            for (const node of data.data) {
                results.push(node);
            }

            let i = 1;
            for (const result of results) {
                let genres = '';

                for (const genre of result.genres) {
                    genres = genres + genre.name + ', '
                }

                genres = genres.substring(0, genres.length - 2)

                let from = '';
                let to = '';

                if (result.aired.from === null) {
                    from = 'No start date setT';
                } else {
                    from = result.aired.from;
                }

                if (result.aired.to === null) {
                    to = 'Not finished airingT';
                } else {
                    to = result.aired.to;
                }

                const embed = new EmbedBuilder()
                    .setColor(0xff99dd)
                    .setTitle(`${result.title_english ?? result.title}`)
                    .setURL(`${result.url}`)
                    .setDescription(`${result.synopsis ?? 'No Synopsis'}`)
                    .setFields(
                        { name: 'Rating', value: `${result.score ?? 'No Rating'}`, inline: true }, 
                        { name: 'Status', value: `${result.status ?? 'No Status'}`, inline: true }, 
                        { name: 'Start Date', value: `${from.substring(0, from.indexOf('T'))}`, inline: true }, 
                        { name: 'End Date', value: `${to.substring(0, to.indexOf('T'))}`, inline: true}, 
                        { name: 'Episodes', value: `${result.episodes ?? 0}`, inline: true },  
                        { name: 'Genres', value: `${genres}`, inline: true }, 
                        { name: 'ID', value: `${result.mal_id}`, inline: true }
                    )
                    .setImage(`${result.images.jpg.image_url}`)
                    .setTimestamp()
                    .setFooter({ text: `Search Results  •  Page ${i} of ${results.length}` });
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
            })
        } catch (error) {
            await interaction.editReply({ content: 'An error occurred! (Most likely API rate limit)', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};