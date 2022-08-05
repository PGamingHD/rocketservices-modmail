const {
    MessageEmbed,
    MessageActionRow,
    MessageButton,
    Discord,
    ModalBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    WebhookClient,
    PermissionFlagsBits
} = require("discord.js");
const client = require("../index");
const ee = require("../botconfig/embed.json");
const emoji = require("../botconfig/emojis.json");
const config = require("../botconfig/config.json");
const embed = require("../botconfig/embed.json");
const {
    languageControl,
    stringTemplateParser
} = require("../handler/functions");

client.on("interactionCreate", async (interaction) => {

    // Slash Command Handling
    if (interaction.isChatInputCommand()) {

        try {
            if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages) || !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.EmbedLinks) || !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.UseExternalEmojis) || !interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.ReadMessageHistory)) {
                await interaction.user.send({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(ee.wrongcolor)
                        .setTitle(await languageControl(interaction.guild, 'MISSING_PERMS_TITLE'))
                        .setDescription(await languageControl(interaction.guild, 'MISSING_PERMS_DESC'))
                    ],
                    ephemeral: true,
                })
            }
        } catch (error) {
            if (!interaction.channel.permissionsFor(interaction.guild.members.me).has(PermissionFlagsBits.SendMessages)) {
                return;
            } else {
                if (error.rawError.message === "Cannot send messages to this user") {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(await languageControl(interaction.guild, 'FAILED_TO_SEND_MSG'))
                        ],
                        components: [],
                    })
                } else {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(await languageControl(interaction.guild, 'RAN_INTO_DM_ERROR'))
                        ],
                        components: [],
                    })
                }
            }
        }

        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd) {
            let embed = new EmbedBuilder()
                .setColor(ee.errorColor)
                .setDescription(await languageControl(interaction.guild, 'COMMAND_ERROR'))
            return interaction.reply({
                embeds: [embed],
                epehemeral: true
            });
        }

        if (cmd.DeveloperCommand && !interaction.user.id.includes(config.DEVELOPER_IDS)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.errorColor)
                    .setTitle(await languageControl(interaction.guild, 'MISSING_PERMS_TITLE'))
                    .setDescription(await languageControl(interaction.guild, 'MISSING_DEV_PERMS'))
                ],
            })
        }

        if (cmd.serverOwner && interaction.member.id !== interaction.guild.ownerId) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.errorColor)
                    .setTitle(await languageControl(interaction.guild, 'MISSING_PERMS_TITLE'))
                    .setDescription(await languageControl(interaction.guild, 'MISSING_OWNER_PERMS'))
                ],
            })
        }

        if (cmd.serverAdmin && !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                    .setColor(ee.errorColor)
                    .setTitle(await languageControl(interaction.guild, 'MISSING_PERMS_TITLE'))
                    .setDescription(await languageControl(interaction.guild, 'MISSING_ADMIN_PERMS'))
                ],
            })
        }

        //INTERACTION BELOW
        const args = [];
        const con = client.connection;

        for (let option of interaction.options.data) {
            if (option.type === "SUB_COMMAND") {
                if (option.name) args.push(option.name);
                option.options?.forEach((x) => {
                    if (x.value) args.push(x.value);
                });
            } else if (option.value) args.push(option.value);
        }
        interaction.member = interaction.guild.members.cache.get(interaction.user.id);

        if (!interaction.member.permissions.has(cmd.userPermissions || []))
            return interaction.reply({
                content: await languageControl(interaction.guild, 'MISSING_CMD_PERMS'),
            });

        await cmd.run(client, interaction, con, args);
    }

    // Context Menu Handling
    /*
    if (interaction.isContextMenuCommand()) {
        await interaction.deferReply({
            ephemeral: false
        });
        const command = client.slashCommands.get(interaction.commandName);
        if (command) command.run(client, interaction);
    }
    */

    if (interaction.isButton()) {
        const {
            member,
            channel,
            message,
            user,
            guild
        } = interaction;

        if (interaction.customId === "claim") {
            const [claimRows, claimFields] = await client.connection.query(`SELECT * FROM modmail_data WHERE modmail_channelid = ${interaction.channel.id}`)

            if (claimRows.length !== 0) {
                const claimData = claimRows[0];

                if (parseInt(claimData.modmail_claimed) !== 0) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: This case has already been claimed by another staff member!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                } else {
                    const claimData = claimRows[0];
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.color)
                            .setDescription(`:white_check_mark: The case has successfully been claimed by ${interaction.user}`)
                            .setFooter({
                                text: `${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}`
                            })
                            .setTimestamp()
                        ]
                    })
                    const mainMSG = await interaction.channel.messages.fetch(claimData.modmail_msgid)
                    const managementButtons = new ActionRowBuilder()
                    managementButtons.addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: "❌"
                        })
                        .setLabel('Close Case')
                        .setCustomId('close')
                        .setStyle(ButtonStyle.Danger)
                    ])
                    managementButtons.addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: "✅"
                        })
                        .setLabel('Claim Case')
                        .setCustomId('claim')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(true)
                    ])
                    managementButtons.addComponents([
                        new ButtonBuilder()
                        .setEmoji({
                            name: "⚠️"
                        })
                        .setLabel('Unclaim Case')
                        .setCustomId('unclaim')
                        .setStyle(ButtonStyle.Primary)
                    ])

                    let justTesting = mainMSG.embeds[0];
                    justTesting.data.footer.text = `Claimed by: ${interaction.user.username}#${interaction.user.discriminator}`;
                    await mainMSG.edit({
                        embeds: [justTesting],
                        components: [managementButtons]
                    })

                    await client.connection.query(`UPDATE modmail_data SET modmail_claimed = ${interaction.user.id} WHERE modmail_channelid = ${interaction.channel.id}`)
                    return;
                }
            } else {
                return;
            }
        }

        if (interaction.customId === "close") {
            const [claimRows, claimFields] = await client.connection.query(`SELECT * FROM modmail_data WHERE modmail_channelid = ${interaction.channel.id}`)

            if (claimRows.length !== 0) {
                const claimData = claimRows[0];

                if(parseInt(claimData.modmail_claimed) === 0) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: Please claim ownership before closing a case!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                }
                if(parseInt(claimData.modmail_claimed) !== parseInt(interaction.user.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: Only the case owner may close the case!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                }

                if (!claimData.modmail_status) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: This case has already been closed!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                }

                await client.connection.query(`UPDATE modmail_data SET modmail_status = 0 WHERE modmail_channelid = ${interaction.channel.id}`);
                let filter = m => m.author.id === interaction.user.id;
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(embed.errorColor)
                        .setDescription(`:warning: Please choose a reason for closing this ticket!`)
                    ]
                }).then(() => {
                    interaction.channel.awaitMessages({
                        filter,
                        max: 1, //MAX COLLECTIONS
                        time: 1000 * 60, // SECONDS
                    }).then(async (collected) => {
                        const reason = collected.first();

                        const mainMSG = await interaction.channel.messages.fetch(claimData.modmail_msgid);
                        const user = await client.users.fetch(`${claimData.modmail_owner}`);

                        const managementButtons = new ActionRowBuilder()
                        managementButtons.addComponents([
                            new ButtonBuilder()
                            .setEmoji({
                                name: "❌"
                            })
                            .setLabel('Close Case')
                            .setCustomId('close')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                        ])
                        managementButtons.addComponents([
                            new ButtonBuilder()
                            .setEmoji({
                                name: "✅"
                            })
                            .setLabel('Claim Case')
                            .setCustomId('claim')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)
                        ])

                        let justTesting = mainMSG.embeds[0];
                        justTesting.data.title = `Modmail Case Closed`;
                        justTesting.data.color = embed.errorColor;

                        await mainMSG.edit({
                            embeds: [justTesting],
                            components: [managementButtons],
                        });

                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                .setColor(embed.errorColor)
                                .setTitle(`Ticket Closed`)
                                .setDescription(`*${reason}*`)
                                .setAuthor({
                                    name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setFooter({
                                    text: `${interaction.guild.name}`,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp()
                            ]
                        })

                        await user.send({
                            embeds: [
                                new EmbedBuilder()
                                .setColor(embed.errorColor)
                                .setDescription(`*${reason}*`)
                                .setTitle(`Ticket Closed`)
                                .setAuthor({
                                    name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setFooter({
                                    text: `${interaction.guild.name}`,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp()
                            ]
                        })

                        setTimeout(async () => {
                            const deletemsg = await interaction.channel.send({
                                content: '[COUNTDOWN] Channel being deleted in 60 seconds!'
                            })

                            let counter = 0;
                            const interval = setInterval(async () => {
                                counter++;
                                if (counter % 5 === 0) {
                                    await deletemsg.edit({
                                        content: `[COUNTDOWN] Channel being deleted in ${60 - counter} seconds!`
                                    })
                                }
                                if (counter === 60) {
                                    clearInterval(interval);
                                    await deletemsg.delete();
                                    await interaction.channel.delete();
                                }
                            }, 1000 * 1);
                        }, 1000 * 5);
                        return;
                    }).catch(async (collected) => {
                        const reason = "No reason specified";
                        const mainMSG = await interaction.channel.messages.fetch(claimData.modmail_msgid);
                        const user = await client.users.fetch(`${claimData.modmail_owner}`);

                        const managementButtons = new ActionRowBuilder()
                        managementButtons.addComponents([
                            new ButtonBuilder()
                            .setEmoji({
                                name: "❌"
                            })
                            .setLabel('Close Case')
                            .setCustomId('close')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                        ])
                        managementButtons.addComponents([
                            new ButtonBuilder()
                            .setEmoji({
                                name: "✅"
                            })
                            .setLabel('Claim Case')
                            .setCustomId('claim')
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)
                        ])

                        let justTesting = mainMSG.embeds[0];
                        justTesting.data.title = `Modmail Case Closed`;
                        justTesting.data.color = embed.errorColor;

                        await mainMSG.edit({
                            embeds: [justTesting],
                            components: [managementButtons],
                        });

                        await interaction.editReply({
                            embeds: [
                                new EmbedBuilder()
                                .setColor(embed.errorColor)
                                .setTitle(`Ticket Closed`)
                                .setDescription(`*${reason}*`)
                                .setAuthor({
                                    name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setFooter({
                                    text: `${interaction.guild.name}`,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp()
                            ]
                        })

                        await user.send({
                            embeds: [
                                new EmbedBuilder()
                                .setColor(embed.errorColor)
                                .setDescription(`*${reason}*`)
                                .setTitle(`Ticket Closed`)
                                .setAuthor({
                                    name: `${interaction.user.username}#${interaction.user.discriminator}`,
                                    iconURL: interaction.user.displayAvatarURL()
                                })
                                .setFooter({
                                    text: `${interaction.guild.name}`,
                                    iconURL: interaction.guild.iconURL()
                                })
                                .setTimestamp()
                            ]
                        })

                        setTimeout(async () => {
                            await interaction.channel.send({
                                content: 'Channel being deleted in 60 seconds!'
                            })
                        }, 1000 * 5);
        
                        setTimeout(async () => {
                            await interaction.channel.delete();
                        }, 1000 * 60);
                        return;
                    })
                })
            } else {
                return;
            }
        }

        if (interaction.customId === "unclaim") {
            const [claimRows, claimFields] = await client.connection.query(`SELECT * FROM modmail_data WHERE modmail_channelid = ${interaction.channel.id}`)

            if (claimRows.length !== 0) {
                const claimData = claimRows[0];

                if(parseInt(claimData.modmail_claimed) === 0) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: Please claim ownership before unclaiming a case!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                }
                if(parseInt(claimData.modmail_claimed) !== parseInt(interaction.user.id)) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: Only the case owner may unclaim the case!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                }
                if (!claimData.modmail_status) {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                            .setColor(embed.errorColor)
                            .setDescription(':x: This case has already been closed!')
                            .setTimestamp()
                        ],
                        ephemeral: true
                    })
                }

                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                        .setColor(embed.color)
                        .setDescription(`:white_check_mark: The case has successfully been unclaimed by ${interaction.user}\n\n*That means the case can be claimed again.*`)
                        .setFooter({
                            text: `${interaction.user.username}#${interaction.user.discriminator} | ${interaction.user.id}`
                        })
                        .setTimestamp()
                    ]
                })
                const mainMSG = await interaction.channel.messages.fetch(claimData.modmail_msgid)
                const managementButtons = new ActionRowBuilder()
                managementButtons.addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "❌"
                    })
                    .setLabel('Close Case')
                    .setCustomId('close')
                    .setStyle(ButtonStyle.Danger)
                ])
                managementButtons.addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "✅"
                    })
                    .setLabel('Claim Case')
                    .setCustomId('claim')
                    .setStyle(ButtonStyle.Success)
                ])
                managementButtons.addComponents([
                    new ButtonBuilder()
                    .setEmoji({
                        name: "⚠️"
                    })
                    .setLabel('Unclaim Case')
                    .setCustomId('unclaim')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
                ])

                let justTesting = mainMSG.embeds[0];
                justTesting.data.footer.text = `Claimed by: Noone`;
                await mainMSG.edit({
                    embeds: [justTesting],
                    components: [managementButtons]
                })

                await client.connection.query(`UPDATE modmail_data SET modmail_claimed = 0 WHERE modmail_channelid = ${interaction.channel.id}`)
                return;
            }
        }
    }
});

/*

Code used in this script has been written by original PizzaParadise developer - PGamingHD#0666
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/pxySje4GPC
Other than that, please do note that it is required if you are using this to mention the original developer
Original Developer - PGamingHD#0666

*/