//           --------------------<CONSTRUCTORS>--------------------

const {
    Client,
    Collection,
    Intents,
    GatewayIntentBits,
    Partials,
    IntentsBitField
} = require("discord.js");
const {
    readdirSync
} = require("fs");
const config = require("./botconfig/config.json");
const chalk = require("chalk");
//const express = require('express');
const mysql = require('mysql2/promise');
//const path = require("path");
require('dotenv').config();


//           --------------------<CONSTRUCTORS>--------------------


//           --------------------<CONSTRUCTING CLIENTS>--------------------

const client = new Client({
    allowedMentions: {
        parse: ["users"], // "everyone", "roles", "users"
        repliedUser: false,
    },
    waitGuildTimeout: 10000,
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,

    ],

    partials: [
        Partials.ActivityType,
        Partials.Channel,
    ],
});

//           --------------------<CONSTRUCTING CLIENTS>--------------------


//           --------------------<MODULE EXPORTS>--------------------

module.exports = client;

//           --------------------<MODULE EXPORTS>--------------------


//           --------------------<GLOBAL VARIABLES CONSTRUCTION>--------------------

client.commands = new Collection();
client.slashCommands = new Collection();
client.cachedGuildLanguages = new Collection();
client.categories = readdirSync("./commands/");
client.config = require("./botconfig/config.json");

//           --------------------<GLOBAL VARIABLES CONSTRUCTION>--------------------


//           --------------------<REQUIRES>--------------------

require("./handler/anticrash")(client);
// Initializing the project
require("./handler")(client);
//require("./database/db")

//           --------------------<REQUIRES>--------------------


//--

async function dbConnection() {

    if (!process.env.MYSQL_PORT.length === 0 || process.env.MYSQL_USER.length === 0 || process.env.MYSQL_PASS.length === 0 || process.env.LOGIN_TOKEN.length === 0 || process.env.MYSQL_DATABASE.length === 0) {
        return console.log(chalk.red("[ERROR] <==> || You must fill out the .env file before starting the project! || <==> [ERROR]"));
    }

    const connection = await mysql.createConnection({

        //DATABASE CREDENTIALS

        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASS,
        database: process.env.MYSQL_DATABASE,

        //DATABASE SETTINGS

        supportBigNumbers: true,
    }).then(console.log(chalk.green("[DATABASE] <==> || Connection has been successfully established with the Database! || <==> [DATABASE]")));

    client.connection = connection;

}

//--


//           --------------------<STARTING ARGUMENTS>--------------------
dbConnection();

client.login(process.env.LOGIN_TOKEN);

//           --------------------<STARTING ARGUMENTS>--------------------

/*

Code used in this script has been written by original PizzaParadise developer - PGamingHD#0666
Require assistance with scripts? Join the discord and get help right away! - https://discord.gg/pxySje4GPC
Other than that, please do note that it is required if you are using this to mention the original developer
Original Developer - PGamingHD#0666

*/