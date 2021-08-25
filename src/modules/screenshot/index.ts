// @ts-ignore 
import { Attachment } from 'mailparser';
import { styles } from './style';
import { ExtractedData } from '../../types';
import puppeteer from 'puppeteer';
import { Logger } from '../../utils/Logger';

// using any type because lib doesn't come with correct types
export const takeScreenshot = async (mail: any): Promise<ExtractedData> => {
    Logger.info("Taking screenshot...");
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const filename = Date.now().toString();

    // @todo filter script tags
    await page.setContent(mail.html as string);

    await page.exposeFunction("getContent", (att: Attachment) => Buffer.from(att.content).toString("base64"));

    await page.evaluate(async (mail, styles) => {

        // Get all infos
        const from = mail.from[0].address
        const fromName = mail.headers.from;
        const to = mail.to.map((addr: any) => addr.name || addr.address.split("@")[0]).join(", ");
        const cc = mail.cc?.map((addr: any) => addr.name || addr.address.split("@")[0]).join(", ");;
        const subject = mail.subject;
        const date = mail.headers.date.substring(0, 22);

        if (!from || !to) return {};

        // init styles
        const head = document.querySelector("head")!;
        head.insertAdjacentHTML("afterbegin", `<style>${styles}</style>`)

        // add infos to html
        const body = document.querySelector("body")!;
        const elements = Array.from(body.getElementsByTagName('*') as HTMLCollectionOf<HTMLElement>);
        for (const element of elements) {
            let colors = element.style.color.replace(/\s+/g, '');

            // regex for rgb
            let matched = colors.match(/rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/);
            if (matched === null) {
                element.style.color = "#dcddde";
                continue;
            }
            matched.shift();
            let rgb = matched.map(Number);
            const luma = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
            if (luma < 61 && luma > 10) {
                rgb = rgb.map(val => val + 80);
                element.style.color = `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
            } else if (luma < 10) {
                element.style.color = "#dcddde";
            }
        }
        body.insertAdjacentHTML("afterbegin", `
              <div class="Mail">
                <div class="header">
                  <h3 class="from2">
                   <div>
                     <span class="from">${fromName}</span>
                       ${from}
                   </div>
                   <div class="time">${date}</div>
                  </h3>
                  <h6 class="to">To: ${to}</h6>
                  ${cc && `<h6 class="to">Cc: ${cc}</h6>`}
                </div>
                <h2 class="subject">Subject: ${subject || "No subject"}</h2>
              </div>
        `)

        // show images in the email image if there are any
        if (mail.attachments) {
            for (let i = 0; i < mail.attachments.length; i++) {
                const attachment = mail.attachments[i];
                const contentType = attachment.contentType.split("/")[0];
                if (contentType !== "image") continue;
                const image = document.querySelector<HTMLImageElement>(`img[src="cid:${attachment.contentId}"]`)!;
                if (!image) continue;
                const content = await (window as any).getContent(attachment);
                image.src = `data:image;base64,${content}`;
            }
        }
    }, mail, styles);

    const output = await page.screenshot({ fullPage: true, path: `screenshots/${filename}.png` }) as Buffer;

    // extract all links from the html
    // @todo filter wrong links (e.g. mailto:foo@example.com)
    const links = new Set(await page.$$eval('a', (elements) => elements?.map(elm => (elm as HTMLAnchorElement).href) || []));

    await browser.close();

    return {
        screenshotBuffer: output,
        links,
        filename
    }
};