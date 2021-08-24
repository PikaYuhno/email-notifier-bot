// @ts-ignore 
import { ParsedMail } from 'mailparser';
import { takeScreenshot } from '../screenshot';
import { Logger } from '../../utils/Logger';
import { Message, MessageAttachment, TextChannel } from 'discord.js';
import path from 'path';
import Notifier from './notifier';
import { BotClient } from '../../types';
import { MessageOptions } from 'child_process';

export const startMailListener = async (client: BotClient) => {
    const { channelId, roleId } = client.config;
    if (!channelId || !roleId) return;
    Logger.debug(`Status ${Notifier.status}`)
    Notifier.start(async (mail: ParsedMail) => {
        //   if (!mail || (typeof mail.html === "boolean" && !mail.html) || !mail.html)
        //         return;

        console.log("Mail", mail);
        const channel = client.channels.cache.get(client.config.channelId) as TextChannel;

        await channel.send(`Listening for new mails`);
        Logger.info(`Listening for new mails`);
        const extractedData = await takeScreenshot(mail);

        if (extractedData && Object.keys(extractedData).length === 0 && extractedData.constructor === Object) return;

        const files: (string | MessageAttachment)[] = [path.join(__dirname, "../../../", `screenshots/${extractedData.filename}.png`)];
        let attachments: (string | MessageAttachment)[] = [];

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

        await thread.send({
            files,
            content: `<@&${client.config.roleId}>`
        });

        attachments.length > 0 && await thread.send({
            files: attachments,
            content: `**Attachments:**`
        });

        let links = "**Links**:\n";
        extractedData.links?.forEach(v => {
            //array.push(v);
            links += v + "\n";

        });

        await thread.send(links);

    })
}