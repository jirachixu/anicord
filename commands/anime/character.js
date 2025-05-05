const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('character')
        .setDescription('Searches for the character specified.')
        .addStringOption(option => 
            option.setName('character')
                .setDescription('The character to find')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('limit')
                .setDescription('How many matches to show (default is 5, max is 20)')
        ),
    async execute(interaction) {
        try {
            const character = interaction.options.getString('character');
            const limit = interaction.options.getInteger('limit') ?? 5;
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

            const response = await fetch(`https://api.jikan.moe/v4/characters?limit=${limit}&q=${character}`);
            
            if (!response.ok) {
                throw new Error('Could not fetch resource.');
            }

            const data = await response.json();

            for (const node of data.data) {
                results.push(node);
            }

            let i = 1;
            for (const result of results) {
                const embed = new EmbedBuilder()
                    .setColor(0xff99dd)
                    .setTitle(`${result.name ?? 'No Name'}`)
                    .setURL(`${result.url}`)
                    .setDescription(`${result.about ?? 'No Information'}`)
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
            await interaction.editReply({ content: 'An error occurred!', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};