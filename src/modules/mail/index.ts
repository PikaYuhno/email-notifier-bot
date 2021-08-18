// @ts-ignore
import notifier from 'mail-notifier';
// @ts-ignore 
import { ParsedMail } from 'mailparser';
import { Client } from '../../Client';
import { imapSettings } from '../../config/config';
import { takeScreenshot } from '../screenshot';
import { Logger } from '../../utils/Logger';
import { MessageAttachment, TextBasedChannelFields, TextChannel } from 'discord.js';
import path from 'path';

export const startMailListener = (client: Client) => {
    Logger.info(`Listening for new mails`);
   // for (const [_, config] of client.config.entries()) {
        notifier(imapSettings)
            .on('mail', async (mail: ParsedMail) => {
                
             //   if (!mail || (typeof mail.html === "boolean" && !mail.html) || !mail.html)
           //         return;
                const filename = await takeScreenshot(mail);
                

              /*  const channel = client.channels.cache.get(config.channelToSendMsgId) as TextChannel;
                const files: (string | MessageAttachment)[] = [path.join(__dirname, "../../../", `screenshots/${filename}.png`)];

                if (mail.attachments) {
                    for (let i = 0; i < mail.attachments.length; i++) {
                        const attachment = mail.attachments[i];
                        files.push(new MessageAttachment(attachment.content, attachment.filename));
                    }
                }

                //await channel.threa

                await channel.send(`<@&${config.roleToPingId}>`, { files }); */ 
            })
            .start();
          }
          
