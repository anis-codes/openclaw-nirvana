import { logger } from '../../logger';
import { notify } from '../../shared/bot';
import { logAction } from '../../shared/log-action';

const FEEDS = [
  'https://www.upwork.com/ab/feed/jobs/rss?q=salesforce+architect&sort=recency',
  'https://www.upwork.com/ab/feed/jobs/rss?q=servicemax&sort=recency',
  'https://www.upwork.com/ab/feed/jobs/rss?q=salesforce+hubspot+integration&sort=recency',
];

const seenJobs = new Set<string>();

export async function scanJobs(): Promise<void> {
  let found = 0;
  for (const feedUrl of FEEDS) {
    try {
      const res = await fetch(feedUrl);
      const text = await res.text();

      const items = text.match(/<item>[\s\S]*?<\/item>/g) ?? [];
      for (const item of items) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? '';
        const link = item.match(/<link>(.*?)<\/link>/)?.[1] ?? '';
        const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ?? '';

        if (seenJobs.has(link)) continue;
        seenJobs.add(link);

        const t1 = /(architect|servicemax|revenue cloud|nonprofit|hubspot.*salesforce)/i;
        const tier = t1.test(title + desc) ? 1 : 2;
        const emoji = tier === 1 ? '\u{1F534}' : '\u{1F7E1}';

        await notify(
          `${emoji} <b>Tier ${tier} Job Found</b>\n` +
          `<b>${title}</b>\n\n` +
          `${desc.slice(0, 300)}...\n\n` +
          `\u{1F517} ${link}\n\n` +
          `Reply: /proposal &lt;paste job details to generate proposal&gt;`
        );

        await logAction({ agent: 'upwork-bd', action: 'job_found',
          metadata: { title, tier, link } });
        found++;
      }
    } catch (err) {
      logger.error('Feed scan failed', { feedUrl, err });
    }
  }
  logger.info(`Job scan complete: ${found} new jobs found`);
}
