const client = require("../index");
const config = require("../botconfig/config.json");
const emoji = require("../botconfig/emojis.json");
const {
    Cron
} = require("croner");
const {
    ActivityType,
    Interaction
} = require("discord.js");
const chalk = require("chalk");

client.on("ready", async (client) => {
    try {
        try {
            const stringlength = 69;
            console.log(chalk.green(`[LOGIN] <==> || I successfully logged into ${client.user.tag} and started ALL services || <==> [LOGIN]`));
        } catch (error) {
            console.log(error)
        }

        const act1 = {
            text: `over your DMS`,
            type: ActivityType.Watching,
        }
        const act2 = {
            text: `DM me to DM Staff!`,
            type: ActivityType.Watching,
        }
        const act3 = {
            text: `Made by PGamingHD#1560`,
            type: ActivityType.Playing
        }
        const activities = [
            act1,
            act2,
            act3
        ]

        const job = Cron('00 */15 * * * *', () => {
            const random = Math.floor(Math.random() * activities.length);
            client.user.setActivity(activities[random].text, {
                type: activities[random].type
            })
        });

        const dbKeepup = Cron('0 0 */1 * * *', () => {
            client.connection.query('SELECT 1');
        });
    } catch (e) {
        console.log(String(e.stack))
    }
});

/*

Code used in this script has been written by original PizzaParadise developer - PGamingHD#0666
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/pxySje4GPC
Other than that, please do note that it is required if you are using this to mention the original developer
Original Developer - PGamingHD#0666

*/