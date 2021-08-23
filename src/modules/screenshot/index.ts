import { Cluster } from 'puppeteer-cluster';
// @ts-ignore 
import { Attachment } from 'mailparser';
import { styles } from './style';
import { ExtractedData } from '../../types';
import  GetUrls from 'get-urls';

export const takeScreenshot = async (mail: any): Promise<ExtractedData> => {
    const cluster: Cluster<any> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2,
    });

    const filename = Date.now().toString();
    const extractedData = await cluster.execute({ mail, filename }, async ({ page, data }): Promise<ExtractedData> => {
        const { mail, filename } = data;
        await page.setContent(mail.html as string);
        const from = mail.from[0].address
        const f = mail.headers.from;
        const to = mail.to.map((addr: any) => addr.name || addr.address.split("@")[0]).join(", ");
        const subject = mail.subject;
 
        const content = await page.content();

        
       

        console.log(`From: ${from}, To: ${to}, Subject: ${subject}`)
        if (!from || !to || !subject) return {};

        await page.$eval('head', (element, params) => {
            const { styles } = params as any;
            element.insertAdjacentHTML("afterbegin", `
              <style>
                  ${styles}
              </style>
          `)
        }, { styles });

        await page.$eval('body', (element, params) => {
            const { from, to, subject, f  } = params as any;
            const options = { weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit',hour:'2-digit',minute:'2-digit' } as const;
            let today  = new Date();
            let date =today.toLocaleDateString("de-DE", options);
            (element as HTMLBodyElement).style.backgroundColor = "#36393f";
            let result = Array.from((element as HTMLBodyElement).getElementsByTagName('*') as HTMLCollectionOf<HTMLElement>);
            for (let i = 0; i < result.length; i++) {
                let colors = (result[i] as any).style.color.replaceAll(' ', '');

                let matchedColors = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;
                let matched = colors.match(matchedColors);
                if (matched != null) {
                    matched.shift();
                    var luma = 0.2126 * matched[0] + 0.7152 * matched[1] + 0.0722 * matched[2];
                    if (luma < 40 && luma > 10) {
                        matched[0] += 80;
                        matched[1] += 80;
                        matched[2] += 80;
                        result[i].style.color = `rgb(${matched[0]}, ${matched[1]}, ${matched[2]})`;
                    }
                    else if(luma <10){
                      result[i].style.color = "#dcddde";
                    }
                }
            }
            element.insertAdjacentHTML("afterbegin", `
              <div class="Mail">
                <div class="header">
                  <h3 class="from2">
                   <div>
                     <span class="from">${f}</span>
                       ${from}
                   </div>
                   <div class="time">${date}</div>
                  </h3>
                  <h6 class="to">to: ${to}</h6>
                </div>
                <h2 class="subject">Subject: ${subject}</h2>
              </div>
        `)
        }, { from, to, subject, f });

        await page.exposeFunction("getContent", (att: Attachment) => {
            return Buffer.from(att.content).toString("base64");;
        })

        if (mail.attachments) {
            for (let i = 0; i < mail.attachments.length; i++) {
                const attachment = mail.attachments[i];
                await page.$eval(`img[src="cid:${attachment.contentId}"]`, async (element, attachment) => {
                    const content = await (window as any).getContent(attachment);
                    (element as HTMLImageElement).src = `data:image;base64,${content}`;
                }, attachment);
            }
        }

        const output = await page.screenshot({ fullPage: true, path: `screenshots/${filename}.png` }) as Buffer;
        const urls = GetUrls(content);
        var links =[urls].join(' ');
        return {
            screenshotBuffer: output,
            links: links,
            filename
        }
    });

    await cluster.idle();
    await cluster.close();

    return extractedData;
};