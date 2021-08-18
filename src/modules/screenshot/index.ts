import { Cluster } from 'puppeteer-cluster';
import path from 'path';
import { Attachment } from 'mailparser';

export const takeScreenshot = async (mail: any): Promise<string> => {
  const cluster: Cluster<any> = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  const filename = Date.now().toString();
  await cluster.execute({mail, filename}, async ({ page, data }) => {
    const {m, f} = data;

    await page.setContent(m.html as string);

    const from = m.from[0].address
    const to = m.to[0].address;
    const subject = m.subject;

    console.log(`From: ${from}, To: ${to}, Subject: ${subject}`)
    if (!from || !to || !subject) return;

    await page.$eval('body', (element, params) => {
      const { from, to, subject } = params as any;
      element.insertAdjacentHTML("afterbegin", `
          <h6>From: ${from}</h6>
          <h6>To: ${to}</h6>
          <h2>Subject: ${subject}</h2>
        `);
    }, { from, to, subject });

    await page.exposeFunction("getContent", (attachment: Attachment) => {
      return Buffer.from(attachment.content.toString('base64'));
    })

    if (m.attachments) {
      for (let i = 0; i < m.attachments.length; i++) {
        const attachment = m.attachments[i];
        await page.$eval(`img[src="cid:${attachment.contentId}"]`, async (element) => {
          const content = await (window as any).getContent(attachment);
          (element as HTMLImageElement).src = `data:image;base64,${content}`;
        });
      }
    }
    
    await page.screenshot({ fullPage: true, path: `screenshots/${f}.png` })
  });

  await cluster.idle();
  await cluster.close();

  return filename;
};