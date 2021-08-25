// @ts-ignore 
import { ParsedMail } from 'mailparser';
import { takeScreenshot } from '../screenshot';
import { Logger } from '../../utils/Logger';
import { MessageAttachment, TextChannel } from 'discord.js';
import path from 'path';
import Notifier from './notifier';
import { BotClient } from '../../types';
import queue from './queue';

export const startMailListener = async (client: BotClient) => {
    const { channelId, roleId } = client.config;

    // check if channel and roles actually exist
    if (!channelId || !roleId) return Logger.error("ChannelId or RoleId not found in config");

    const task = (mail: ParsedMail) => () => new Promise(async (res) => {
        Logger.info("Processing mail...");
        //   if (!mail || (typeof mail.html === "boolean" && !mail.html) || !mail.html)
        //         return;

        //console.log("Mail", mail);
        const channel = client.channels.cache.get(client.config.channelId) as TextChannel;

        const extractedData = await takeScreenshot(mail);

        if (extractedData && Object.keys(extractedData).length === 0 && extractedData.constructor === Object) return;

        const files: (string | MessageAttachment)[] = [path.join(__dirname, "../../../", `screenshots/${extractedData.filename}.png`)];
        let attachments: (string | MessageAttachment)[] = [];
        const links = Array.from(extractedData.links!);

        if (mail.attachments) {
            for (let i = 0; i < mail.attachments.length; i++) {
                const attachment = mail.attachments[i];
                attachments.push(new MessageAttachment(attachment.content, (<any>attachment).generatedFileName));
            }
        }

        const thread = await channel.threads.create({
            name: mail.subject || "No subject",
            autoArchiveDuration: 60
        });

        Logger.info("Sending email to discord...");
        await thread.send({
            files,
            content: `<@&${client.config.roleId}>`
        });

        attachments.length > 0 && await thread.send({
            files: attachments,
            content: `**Attachments:**`
        });

        links.length > 0 && await thread.send(`**Links:**\n${links.join("\n")}`);
        res(2);
        Logger.warn("Done with task!");
    });

    Notifier.start(async (mail: ParsedMail) => {
        queue.enqueue(task(mail));
    });
}