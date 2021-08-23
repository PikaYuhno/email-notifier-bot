import { Collection } from 'discord.js';
import { Service } from 'typedi';
import { join } from 'path';
import { readdir, statSync } from 'fs';
import { BotClient, Config } from '../types/bot/Bot';
import { Command } from '../Command';
import { Logger } from '../utils/Logger';
import fs from 'fs';

@Service()
export class ActionManager {
    public commands: Collection<string, Command> = new Collection<string, Command>();
    public guildConfig: Config = { channelId: "", roleId: ""};

    /**
     * Parses files into commands from the configured command path.
     * @param {BotClient} client The original client, for access to the configuration.
     */
    public initializeConfig(client: BotClient): void {
        let rawdata = fs.readFileSync("./config.json", {
            encoding: "utf-8"
        });
        let config = JSON.parse(rawdata);
        this.guildConfig = config;
    }

    /**
     * Parses files into commands from the configured command path.
     * @param {BotClient} client The original client, for access to the configuration.
     */
    public initializeCommands(client: BotClient): void {
        const { commands } = client.settings.paths;

        readdir(commands, (err, files) => {
            if (err) Logger.error(err);

            files.forEach(async cmd => {
                if (statSync(join(commands, cmd)).isDirectory()) {
                    this.initializeCommands(client);
                } else {
                    const Command: any = (await import(join(
                        __dirname,
                        '../../',
                        `${commands}/${cmd}`
                    ))).default;
                    const command = new Command(client);

                    this.commands.set(command.conf.name, command);
                }
            });
        });
    }

    /**
     * Initializes every event from the configured event path.
     * @param {BotClient} client The original client, for access to the configuration.
     */
    public initializeEvents(client: BotClient): void {
        const { events } = client.settings.paths;

        readdir(events, (err, files) => {
            if (err) Logger.error(err);

            files.forEach(async evt => {
                const Event: any = (await import(join(
                    __dirname,
                    '../../',
                    `${events}/${evt}`
                ))).default;

                const event = new Event(client);
                const eventName = evt.split('.')[0];

                client.on(
                    eventName.charAt(0).toLowerCase() + eventName.slice(1),
                    (...args: string[]) => event.run(args)
                );
            });
        });
    }
}
