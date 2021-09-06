// @ts-ignore 
import { ParsedMail } from 'mailparser';
import { takeScreenshot } from '../screenshot';
import { Logger } from '../../utils/Logger';
import { DMChannel, MessageAttachment, TextChannel, ThreadChannel } from 'discord.js';
import path from 'path';
import Notifier from './notifier';
import { BotClient } from '../../types';
import dotenv from 'dotenv';
dotenv.config();

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

    Notifier.start(async (mail: ParsedMail) => {
        Logger.info("Processing mail...");
        //   if (!mail || (typeof mail.html === "boolean" && !mail.html) || !mail.html)
        //         return;

        console.log("Mail", mail);
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

        let targetChannel: ThreadChannel | DMChannel | null = null;

        // if message goes to the owner
        if ((mail.to! as any).length === 1) {
            const owner = await client.users.cache.get(process.env.ACCOUNT_OWNER_ID!)!.fetch();
            targetChannel = await owner.createDM();
        } else {
            targetChannel = await channel.threads.create({
                name: mail.subject || "No subject",
                autoArchiveDuration: 60
            });
        }

        Logger.info("Sending email to discord...");
        await targetChannel.send({
            files,
            content: (targetChannel.type === "GUILD_PUBLIC_THREAD" && `<@&${client.config.roleId}>`) || null
        });

        attachments.length > 0 && await targetChannel.send({
            files: attachments,
            content: `**Attachments:**`
        });

        links.length > 0 && await targetChannel.send(`**Links:**\n${links.join("\n")}`);
    })
}
