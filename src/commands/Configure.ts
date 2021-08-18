import { Message } from 'discord.js';
import { Command } from '../Command';
import { BotClient } from '../types';

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
    public async run(message: Message): Promise<void> {

    }
}
