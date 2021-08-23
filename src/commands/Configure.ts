import { Message } from 'discord.js';
import { Command } from '../Command';
import { BotClient } from '../types';
import fs from 'fs';
import Notifier from '../modules/mail/notifier';
import { startMailListener } from '../modules/mail';
import { Logger } from '../utils/Logger';

export default class Configure extends Command {
    constructor(client: BotClient) {

        super(client, {
            name: 'configure',
            description: 'Configures the bot',
            category: 'Information',
            usage: client.settings.prefix.concat('configure'),
            cooldown: 1000,
            requiredPermissions: ['SEND_MESSAGES']
        });
    }

    // @todo get config
    // create or update db
    // !configure channel <id> role <id>
    public async run(message: Message, args: string[]): Promise<void> {
        Logger.info(`Executing command configure with params ${args.join(" ")}`);
        let rawdata = fs.readFileSync('./config.json', {
            encoding: "utf-8"
        });
        let config = JSON.parse(rawdata);

        for (let i = 0; i < args.length; i+=2) {
            if (args[i] === "channel") {
                const channelId = args[i+1];
                const exists = this.client.channels.cache.has(channelId)
                if (!exists) {
                    super.respond(message.channel, `${channelId} doesn't exist!`);
                    return;
                }
                config["channelId"] = channelId;
            } else if (args[i] === "role") {
                const roleId = args[i+1];
                const exists = message.guild?.roles.cache.has(roleId);
                if (!exists) {
                    super.respond(message.channel, `${roleId} doesn't exist!`);
                    return;
                }
                config["roleId"] = roleId;
            }
        }

        let data = JSON.stringify(config);
        fs.writeFileSync('./config.json', data);
        this.client.config = config;

        // restart the mail listener
        Notifier.stop();
        await new Promise((res, _) => setTimeout(res, 1000));
        startMailListener(this.client);
    }
}
