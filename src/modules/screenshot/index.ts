import { Cluster } from 'puppeteer-cluster';
import path, { normalize } from 'path';
// @ts-ignore
import { Attachment } from 'mailparser';
import { styles } from './style';
export const takeScreenshot = async (mail: any): Promise<string> => {
    const cluster: Cluster<any> = await Cluster.launch({
        concurrency: Cluster.CONCURRENCY_CONTEXT,
        maxConcurrency: 2
    });

    const filename = Date.now().toString();

    await cluster.execute({ mail, filename }, async ({ page, data }) => {
        const { mail, filename } = data;
        await page.setContent(mail.html as string);
        const from = mail.from[0].address;
        const f = mail.headers.from;
        const to = mail.to.map((addr: any) => addr.name).join(', ');
        const subject = mail.subject;

        console.log(`From: ${from}, To: ${to}, Subject: ${subject}`);
        if (!from || !to || !subject) return;

        await page.$eval(
            'head',
            (element, params) => {
                const { styles } = params as any;
                element.insertAdjacentHTML(
                    'afterbegin',
                    `
      
      <style>
        
      ${styles}
      </style>
      `
                );
            },
            { styles }
        );

        await page.$eval(
            'body',
            (element, params) => {
                const { from, to, subject, f } = params as any;
                let result = Array.from(
                    (element as HTMLBodyElement).getElementsByTagName('*') as HTMLCollectionOf<
                        HTMLElement
                    >
                );
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

                // [96, 48, 59]
                (element as HTMLBodyElement).style.backgroundColor = '#36393f';
                //const f = from.match(/(\w+\s)*/g);

                element.insertAdjacentHTML(
                    'afterbegin',
                    `
          <div class="Mail">
            <div class="header">
              <h3 class="from2">
               <div>
                 <span class="from">${f}</span>
                   ${from}
               </div>
               <div class="time">18.08.2021</div>
              </h3>
              <h6 class="to">to: ${to}</h6>
            </div>
            <h2 class="subject">Subject: ${subject}</h2>
          </div>
          
        `
                );
            },
            { from, to, subject, f }
        );

        await page.exposeFunction('getContent', (attachment: Attachment) => {
            return Buffer.from(attachment.content.toString('base64'));
        });

        if (mail.attachments) {
            for (let i = 0; i < mail.attachments.length; i++) {
                const attachment = mail.attachments[i];
                await page.$eval(`img[src="cid:${attachment.contentId}"]`, async element => {
                    const content = await (window as any).getContent(attachment);
                    (element as HTMLImageElement).src = `data:image;base64,${content}`;
                });
                console.log(attachment);
            }
        }
        const content = await page.content();
        console.log('Content', content);
        await page.screenshot({ fullPage: true, path: `screenshots/${filename}.png` });
    });

    await cluster.idle();
    await cluster.close();

    return filename;
};
