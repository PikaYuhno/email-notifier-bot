import { Client } from "../Client";
import { BotEvent } from "../types";
import fs from 'fs';

export default class GuildCreate implements BotEvent {

    constructor(private client: Client) {}

    public async run(args: any): Promise<void> {
        let data = JSON.stringify({
            channelId: "",
            roleId: ""
        });
        fs.writeFileSync('./config.json', data);
    }
}