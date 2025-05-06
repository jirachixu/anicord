const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, MessageFlags } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('thisseason')
        .setDescription('Gets the anime airing this season.')
        .addStringOption(option => 
            option.setName('type')
                .setDescription('what type of anime (leave blank for all)')
                .setChoices(
                    { name: 'television (series)', value: 'tv' },
                    { name: 'movie', value: 'movie' },
                    { name: 'ova', value: 'ova' }, 
                    { name: 'special', value: 'special' }, 
                    { name: 'ona', value: 'ona' }, 
                ))
        .addIntegerOption(option =>
            option.setName('continuing')
                .setDescription('whether to include anime that started airing in a previous season (default is no)')
                .setChoices(
                    { name: 'yes', value: 1 }, 
                    { name: 'no', value: 0 }
                )
        ),
    async execute(interaction) {
        try {
            let type = interaction.options.getString('type');
            let continuing = interaction.options.getBoolean('continuing') ?? 0;
            let results = [];
            let embeds = [];

            const reply = await interaction.deferReply();

            let response = '';

            if (!type && !continuing) {
                response = await fetch(`https://api.jikan.moe/v4/seasons/now`);
                type = 'all types';
                continuing = 'not including continuing'
            } else if (!type && continuing) {
                response = await fetch(`https://api.jikan.moe/v4/seasons/now?continuing`);
                type = 'all types';
                continuing = 'including continuing'
            } else if (type && !continuing) {
                response = await fetch(`https://api.jikan.moe/v4/seasons/now?type=${type}`);
                continuing = 'not including continuing'
            } else {
                response = await fetch(`https://api.jikan.moe/v4/seasons/now?type=${type}&continuing`);
                continuing = 'including continuing'
            }
            
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
                        { name: 'Genres', value: `${genres}`, inline: true }
                    )
                    .setImage(`${result.images.jpg.image_url}`)
                    .setTimestamp()
                    .setFooter({ text: `Anime this season (${type}, ${continuing})  •  Page ${i} of ${results.length}` });
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
            await interaction.editReply({ content: 'An error occurred!', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};