import { logger } from '../../logger';

const FEEDS = [
  { url: 'https://www.upwork.com/ab/feed/jobs/rss?q=salesforce+architect&sort=recency', niche: 'SF Architect' },
  { url: 'https://www.upwork.com/ab/feed/jobs/rss?q=salesforce+flow+migration&sort=recency', niche: 'Flow Migration' },
  { url: 'https://www.upwork.com/ab/feed/jobs/rss?q=servicemax&sort=recency', niche: 'ServiceMax' },
  { url: 'https://www.upwork.com/ab/feed/jobs/rss?q=hubspot+automation&sort=recency', niche: 'HubSpot Auto' },
  { url: 'https://www.upwork.com/ab/feed/jobs/rss?q=salesforce+hubspot+integration&sort=recency', niche: 'SF-HS Integration' },
  { url: 'https://www.upwork.com/ab/feed/jobs/rss?q=salesforce+nonprofit+npsp&sort=recency', niche: 'Nonprofit NPSP' },
];

interface TrendResult {
  niche: string;
  count: number;
  samples: string[];
}

export async function scanUpworkTrends(): Promise<string> {
  const results: TrendResult[] = [];

  for (const feed of FEEDS) {
    try {
      const res = await fetch(feed.url);
      const text = await res.text();
      const items = text.match(/<item>[\s\S]*?<\/item>/g) ?? [];

      const titles: string[] = [];
      for (const item of items.slice(0, 5)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ?? '';
        if (title) titles.push(title);
      }

      results.push({ niche: feed.niche, count: items.length, samples: titles.slice(0, 3) });
    } catch (err) {
      logger.error(`Trend scan failed for ${feed.niche}`, { err });
      results.push({ niche: feed.niche, count: 0, samples: [] });
    }
  }

  // Sort by job count descending
  results.sort((a, b) => b.count - a.count);

  let msg = `<b>📊 UPWORK TRENDS (Last 24h)</b>\n\n`;
  for (const r of results) {
    const bar = '█'.repeat(Math.min(r.count, 20));
    msg += `<b>${r.niche}:</b> ${r.count} jobs ${bar}\n`;
    if (r.samples.length) {
      r.samples.forEach(s => {
        msg += `  • ${s.slice(0, 60)}${s.length > 60 ? '...' : ''}\n`;
      });
    }
    msg += '\n';
  }

  const hottest = results[0];
  msg += `<b>🔥 Hottest niche:</b> ${hottest.niche} (${hottest.count} jobs)\n`;
  msg += `<b>💡 Recommendation:</b> Focus proposals on ${hottest.niche} this week.`;

  return msg;
}
