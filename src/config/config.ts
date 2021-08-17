import { BotSettings } from '../types/bot/bot';
import { MailParser } from 'mailparser';
import { Config } from 'imap'
import * as dotenv from 'dotenv';
dotenv.config();


export const settings: BotSettings = {
    presence: {
        activity: {
            name: '!help for commands',
            type: 'PLAYING'
        }
    },
    prefix: '!',
    paths: {
        commands: 'src/commands',
        events: 'src/events'
    }
};

export const imapSettings: Config = {
    user: process.env.MAIL_USER!,
    password: process.env.MAIL_PW!,
    host: "mail.spengergasse.at",
    port: 993, // imap port
    tls: true,// use secure connection
    tlsOptions: { rejectUnauthorized: false }
}