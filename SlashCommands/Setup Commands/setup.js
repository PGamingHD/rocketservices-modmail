const {
    Client,
    CommandInteraction,
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    EmbedBuilder,
    ChannelType,
    PermissionFlagsBits
} = require('discord.js');
const ee = require('../../botconfig/embed.json');
const emoji = require('../../botconfig/embed.json')
const prettyMilliseconds = require('pretty-ms');
const config = require('../../botconfig/config.json');
const {
    languageControl,
    stringTemplateParser
} = require("../../handler/functions");

module.exports = {
    name: 'setup',
    description: 'Set the server up to a fully work with the Modmail system!',
    serverOwner: true,
    /** 
     * @param {Client} client 
     * @param {Message} message 
     * @param {String[]} args 
     */
    run: async (client, interaction, con, args) => {
        const foundPriorChannel = await interaction.guild.channels.cache.find(channel => channel.name.toLowerCase() === 'modmail service' || channel.name.toLowerCase() === 'modmail' && channel.type === ChannelType.GuildCategory)
        const [foundRows, foundFields] = await con.query(`SELECT modmail_categoryid FROM modmail_setup`);

        if (foundPriorChannel && foundRows.length === 1) {
            await con.query(`UPDATE modmail_setup SET modmail_categoryid = ${foundPriorChannel.id}`);

            return interaction.reply({
                content: ':white_check_mark: Successfully changed the Modmail category!',
                ephemeral: true
            })
        } else if (foundPriorChannel && foundRows.length === 0) {
            await con.query(`INSERT INTO modmail_setup (modmail_categoryid) VALUES (${foundPriorChannel.id})`);

            return interaction.reply({
                content: ':white_check_mark: Successfully changed the Modmail category!',
                ephemeral: true
            })
        } else {
            const category = await interaction.guild.channels.create({
                type: ChannelType.GuildCategory,
                name: 'Modmail Service',
                permissionOverwrites: [{
                    id: interaction.guild.id,
                    deny: [
                        PermissionFlagsBits.ViewChannel,
                        PermissionFlagsBits.SendMessages
                    ]
                }]
            })
            await con.query('TRUNCATE TABLE modmail_setup')
            await con.query('TRUNCATE TABLE modmail_data')
            await con.query(`INSERT INTO modmail_setup (modmail_categoryid) VALUES (${category.id})`)

            return interaction.reply({
                content: ':white_check_mark: Successfully setup the Modmail category!',
                ephemeral: true
            })
        }
    }
}