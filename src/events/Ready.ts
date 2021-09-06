import { Client } from '../Client';
import { Logger } from '../utils/Logger';
import { BotEvent } from '../types';
import { startMailListener } from '../modules/mail';
import { TextChannel } from 'discord.js';

export default class Ready implements BotEvent {
    constructor(private client: Client) { }

    public async run(): Promise<void> {
        if (this.client.user) {
            Logger.info(`${this.client.user.username} is running.`);
            const { channelId, roleId } = this.client.config;
            if (channelId && roleId)
                this.client.user.setPresence({ activities: [{ name: 'Bot is configured!', type: 'LISTENING' }] });
            else
                this.client.user.setPresence({ activities: [{ name: 'Bot is not configured!', type: 'WATCHING' }] });
        }
        const { channelId, roleId } = this.client.config;
        const channel = this.client.channels.cache.get(channelId) as TextChannel;
        const role = channel?.guild.roles.cache.has(roleId);
        if (!channel || !role) this.client.config = { channelId: '', roleId: '' };
        startMailListener(this.client);
    }
}
