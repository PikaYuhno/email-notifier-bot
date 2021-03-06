import { Collection, Client as DiscordClient, Intents } from 'discord.js';
import { Service } from 'typedi';
import { Logger } from './utils/Logger';
import { BotSettings, BotClient, Config } from './types';
import { Command } from './Command';
import { ActionManager } from './managers/ActionManager';
import { settings as configuration } from './config/config';

@Service()
export class Client extends DiscordClient implements BotClient {
    public settings: BotSettings;

    constructor(private actionManager: ActionManager) {
        super(configuration.clientOptions || { intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES]});
        this.settings = configuration;
        this.settings.token = process.env.BOT_TOKEN;
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            this.actionManager.initializeCommands(this);
            this.actionManager.initializeEvents(this);
            this.actionManager.initializeConfig(this);
            await this.login(configuration.token);
        } catch (e) {
            Logger.error(`Could not initialize bot: ${e}`);
        }
    }

    public get commands(): Collection<string, Command> {
        return this.actionManager.commands;
    }

    public get config(): Config {
        return this.actionManager.guildConfig;
    }

    public set config(config: Config) {
        this.actionManager.guildConfig = config;
    }
}
