const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maluser')
        .setDescription('Searches for the user specified.')
        .addStringOption(option => 
            option.setName('username')
                .setDescription('The MAL user to find')
                .setRequired(true)
            ),
    async execute(interaction) {
        try {
            const username = interaction.options.getString('username');

            const response = await fetch(`https://api.jikan.moe/v4/users/${username}/full`);
            
            if (!response.ok) {
                await interaction.reply({ content: 'This user doesn\'t exist!', flags: MessageFlags.Ephemeral });
                return;
            }

            const data = await response.json();

            if (!data.data) {
                await interaction.reply({ content: 'This user doesn\'t exist!', flags: MessageFlags.Ephemeral });
                return;
            }

            const reply = await interaction.deferReply();

            const result = data.data;

            const embed = new EmbedBuilder()
                .setColor(0xff99dd)
                .setTitle(`${result.username ?? 'No Username'}`)
                .setURL(`${result.url}`)
                .setFields(
                    { name: 'Joined', value: `${result.joined.substring(0, result.joined.indexOf('T'))}`, inline: true }, 
                    { name: 'Last Online', value: `${result.last_online.substring(0, result.last_online.indexOf('T'))}`, inline: true }, 
                    { name: 'Episodes Watched', value: `${result.statistics.anime.episodes_watched ?? 0}`, inline: true }, 
                    { name: 'Animes Watched', value: `${result.statistics.anime.completed ?? 0}`, inline: true}, 
                    { name: 'Currently Watching', value: `${result.statistics.anime.watching ?? 0}`, inline: true },  
                    { name: 'Plan to Watch', value: `${result.statistics.anime.plan_to_watch ?? 0}`, inline: true },  
                    { name: 'On Hold', value: `${result.statistics.anime.on_hold ?? 0}`, inline: true },  
                    { name: 'Dropped', value: `${result.statistics.anime.dropped ?? 0}`, inline: true },  
                )
                .setImage(`${result.images.jpg.image_url}`)
                .setTimestamp()
                .setFooter({ text: `User Search Result` });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await interaction.editReply({ content: 'An error occurred! (Most likely API rate limit)', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};