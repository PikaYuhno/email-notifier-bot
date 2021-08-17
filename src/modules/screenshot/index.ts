import { Cluster } from 'puppeteer-cluster';
import path from 'path';

export const takeScreenshot = async (content: string) => {
  const cluster: Cluster<string> = await Cluster.launch({
    concurrency: Cluster.CONCURRENCY_CONTEXT,
    maxConcurrency: 2,
  });

  cluster.execute(content, async ({page, data}) => {
      await page.setContent(data);
      await page.screenshot({ fullPage: true, path: `screenshots/${Date.now()}.png`})
  });

  await cluster.idle();
  await cluster.close();
};