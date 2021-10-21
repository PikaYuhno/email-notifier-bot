// @ts-ignore 
import { ParsedMail } from 'mailparser';
import { takeScreenshot } from '../screenshot';
import { Logger } from '../../utils/Logger';
import { DMChannel, MessageAttachment, MessageOptions, MessagePayload, TextChannel, ThreadChannel } from 'discord.js';
import path from 'path';
import Notifier from './notifier';
import { BotClient } from '../../types';
import dotenv from 'dotenv';
dotenv.config();
import queue from './queue';
import { sendToChannel } from '../../utils/Utils';
import { link } from 'fs';

export const startMailListener = async (client: BotClient) => {
    const { channelId, roleId } = client.config;

    // check if channel and roles actually exist
    if (!channelId || !roleId) return Logger.error("ChannelId or RoleId not found in config");
    const channel = client.channels.cache.get(channelId) as TextChannel;
    const role = channel.guild.roles.cache.has(roleId);
    if (!channel || !role) return Logger.error("Channel or Role not found");
    // check if owner exists
    const owner = await client.users.fetch(process.env.ACCOUNT_OWNER_ID!);
    if (!owner) return Logger.error("Owner doesn't exist!");

    const task = (mail: ParsedMail) => () => new Promise<void>(async (res) => {
        Logger.info("Processing mail...");
        //   if (!mail || (typeof mail.html === "boolean" && !mail.html) || !mail.html)
        //         return;

        console.log("Mail", mail);
        const channel = client.channels.cache.get(client.config.channelId) as TextChannel;

        const extractedData = await takeScreenshot(mail);

        if (extractedData && Object.keys(extractedData).length === 0 && extractedData.constructor === Object) return;

        const finalImage = process.env.NODE_ENV === "production" ?
            new MessageAttachment(extractedData.screenshotBuffer!, extractedData.filename!) :
            path.join(__dirname, "../../../", `screenshots/${extractedData.filename}`);

        const files: (string | MessageAttachment)[] = [finalImage];
        let attachments: (string | MessageAttachment)[] = [];
        const links = Array.from(extractedData.links!);

        if (mail.attachments) {
            for (let i = 0; i < mail.attachments.length; i++) {
                const attachment = mail.attachments[i];
                attachments.push(new MessageAttachment(attachment.content, (<any>attachment).generatedFileName));
            }
        }

        let targetChannel: ThreadChannel | DMChannel | null = null;

        // if message goes to the owner
        const to = mail.to! as any;
        if (to.length === 1 && to[0].address?.toLowerCase() === process.env.MAIL_USER!.toLowerCase()) {
            const owner = await client.users.cache.get(process.env.ACCOUNT_OWNER_ID!)!.fetch();
            targetChannel = await owner.createDM();
        } else {
            targetChannel = await channel.threads.create({
                name: mail.subject || "No subject",
                autoArchiveDuration: 60
            });
        }

        Logger.info("Sending email to discord...");
        await sendToChannel(targetChannel, {
            files,
            content: (targetChannel.type === "GUILD_PUBLIC_THREAD" && `<@&${client.config.roleId}>`) || null
        });

        attachments.length > 0 && await sendToChannel(targetChannel, {
            files: attachments,
            content: `**Attachments:**`
        });

        const MESSAGE_CONTENT_LIMIT = 2000;
        const linksStr = links.join("\n")
        links.length > 0 && await sendToChannel(targetChannel, {
            files: linksStr.length >= MESSAGE_CONTENT_LIMIT ? [new MessageAttachment(Buffer.from(linksStr), "links.txt")] : undefined,
            content: `**Links:**\n${linksStr.length <= MESSAGE_CONTENT_LIMIT ? links.join("\n") : ""}`
        });
        res();
        Logger.warn("Done with task!");
    });

    Notifier.start(async (mail: ParsedMail) => {
        queue.enqueue(task(mail));
    });
}
