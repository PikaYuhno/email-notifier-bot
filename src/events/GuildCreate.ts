import { Client } from "../Client";
import { BotEvent } from "../types";
import fs from 'fs';
import { settings } from "../config/config";

export default class GuildCreate implements BotEvent {

    constructor(private client: Client) {}

    public async run(args: any): Promise<void> {
        let data = JSON.stringify({
            channelId: "",
            roleId: ""
        });
        fs.writeFileSync(settings.configPath, data);
        this.client.user?.setPresence({activities: [{name: 'Bot is not configured!', type: 'PLAYING'}]});
    }
}