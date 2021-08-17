// @ts-ignore
import notifier from 'mail-notifier';
import { ParsedMail } from 'mailparser';
import { Client } from '../../Client';
import { imapSettings } from '../../config/config';
import { takeScreenshot } from '../screenshot';
import { Logger } from '../../utils/Logger';

export const startMailListener = (client: Client) => {
    Logger.info(`Listening for new mails`);
    notifier(imapSettings)
        .on('mail', async (mail: ParsedMail) => {
            /*if (typeof mail.html === "boolean" && !mail.html || !mail.textAsHtml)
                return;*/
            console.log(mail);
            if (!mail.html) return;
            await takeScreenshot(mail.html);
        })
        .start();
}