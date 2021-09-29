import { BotSettings } from '../types/bot/Bot';
import { Config } from 'imap'
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

export const settings: BotSettings = {
    presence: {
        activities: [{
            name: '!help for commands',
            type: 'PLAYING',
        }]
    },
    prefix: '!',
    paths: {
        commands: path.join(__dirname, "../commands"),
        events: path.join(__dirname, "../events")
    },
    configPath: path.join("./configuration", "config.json")
}

export const imapSettings: Config = {
    user: process.env.MAIL_USER!,
    password: process.env.MAIL_PW!,
    host: "mail.spengergasse.at",
    port: 993, // imap port
    tls: true,// use secure connection
    tlsOptions: { rejectUnauthorized: false }
}