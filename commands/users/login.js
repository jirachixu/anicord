const { SlashCommandBuilder, MessageFlags, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ContainerBuilder } = require('discord.js')
const { verifyChallenge, generateChallenge } = require('pkce-challenge');
const pkceChallenge = require('pkce-challenge').default;
const config = require('../../config.json');
const axios = require('axios');
const port = 7115;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('login')
        .setDescription('Logs into your MAL account.'),
    async execute(interaction) {
        try {
            const reply = await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const data = await pkceChallenge();
            const codeChallenge = data.code_challenge;
            const codeVerifier = data.code_verifier;
            const state = interaction.user.id;

            try {
                await axios.post(`http://localhost:${port}/store-verifier`, {
                    userId: state,
                    codeVerifier: codeVerifier,
                });
            }
            catch (error) {
                console.error('Error storing code verifier:', error);
                return interaction.editReply({ content: 'Could not start the login process. Please try again later.', flags: MessageFlags.Ephemeral });
            }

            const authorizationUrl = `https://myanimelist.net/v1/oauth2/authorize?response_type=code&client_id=${config.malClientId}&code_challenge=${codeChallenge}&state=${state}`;

            const container = new ContainerBuilder()
                .setAccentColor(0xff99dd)
                .addTextDisplayComponents(
                    text => text.setContent(`### Click to log in to MAL via OAuth`)
                )
                .addActionRowComponents(
                    row => row.setComponents(
                        new ButtonBuilder()
                            .setLabel('Verify')
                            .setStyle(ButtonStyle.Link)
                            .setURL(authorizationUrl)
                    ),
                );

            await interaction.editReply({ components: [container], flags: [MessageFlags.Ephemeral, MessageFlags.IsComponentsV2] });
        } catch (error) {
            await interaction.editReply({ content: 'An error occurred! (Most likely API rate limit)', flags: MessageFlags.Ephemeral });
            console.error(error);
        }
    },
};