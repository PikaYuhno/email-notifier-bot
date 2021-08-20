import { Cluster } from 'puppeteer-cluster';
import path, { normalize } from 'path';
// @ts-ignore 
import { Attachment } from 'mailparser';
import { styles } from './style';

export const takeScreenshot = async (mail: any): Promise<string> => {
  const cluster: Cluster<any> = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  
  const filename = Date.now().toString();
  await cluster.execute({mail, filename}, async ({ page, data }) => {
    const {mail, filename} = data;

    await page.setContent(mail.html as string);
    const from = mail.from[0].address
    const f = mail.headers.from;
    const to = mail.to.map((addr: any) => addr.name).join(", ");
    const subject = mail.subject;

    console.log(`From: ${from}, To: ${to}, Subject: ${subject}`)
    if (!from || !to || !subject) return;

    await page.$eval('head', (element, params) => {
      const { styles } = params as any;
      element.insertAdjacentHTML("afterbegin", `
      
      <style>
        
      ${styles}
      </style>
      `)
    },{styles} );

    await page.exposeFunction("brightnessByColor",(element: any)=> {
      let all = element;
      function rgbToHsl(r:any, g:any, b:any) {
        r /= 255, g /= 255, b /= 255;
      
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h: number, s : number, l :number = (max + min) / 2;
      
        if (max == min) {
          h = s = 0; // achromatic
        } else {
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;   
          }
      
          h = h! / 6;
        }
     
        return [ h, s, l ];
      }

      for (let i=0, max=all.length; i < max; i++) {
        
        let color = (all[i] as any).style.color.replaceAll(" ", "");
        let matchedColors = /rgb\((\d{1,3}),(\d{1,3}),(\d{1,3})\)/;
        let matched= color.match(matchedColors)
        matched.shift();
        
        let [h, s, l] = rgbToHsl(matched[0], matched[1], matched[2]);
       
         
            
            (all[i] as any).style.color="#FFF"
            //`hsl(${h},${s},${l})`;
          
          
          }
    })
    
    await page.$eval('body', (element, params) => {
      const { from, to, subject, f } = params as any;
      let result = (element as HTMLBodyElement).getElementsByTagName("*");
      (window as any).brightnessByColor(result);
      (element as HTMLBodyElement).style.backgroundColor = "#36393f";
      //const f = from.match(/(\w+\s)*/g);
     
      element.insertAdjacentHTML("afterbegin", `
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
          
        `)
    }, { from, to, subject,f });

    await page.exposeFunction("getContent", (attachment: Attachment) => {
      return Buffer.from(attachment.content.toString('base64'));
    })
    
    
    
    if (mail.attachments) {
      for (let i = 0; i < mail.attachments.length; i++) {
        const attachment = mail.attachments[i];
        await page.$eval(`img[src="cid:${attachment.contentId}"]`, async (element) => {
          const content = await (window as any).getContent(attachment);
          (element as HTMLImageElement).src = `data:image;base64,${content}`;
        });
      }
    }
    const content = await page.content()
    console.log("Content", content);
    await page.screenshot({ fullPage: true, path: `screenshots/${filename}.png` })
  });

  await cluster.idle();
  await cluster.close();

  return filename;
  
};


