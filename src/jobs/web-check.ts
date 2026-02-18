import { notify } from '../shared/bot';
import { logger } from '../logger';

interface SiteCheck {
  name: string;
  url: string;
  expectStatus?: number;
}

const SITES: SiteCheck[] = [
  { name: 'Nirvana Solutions', url: 'https://nirvanasolutionsllc.com', expectStatus: 200 },
];

export async function runWebChecks(): Promise<void> {
  const issues: string[] = [];

  for (const site of SITES) {
    try {
      const start = Date.now();
      const res = await fetch(site.url, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });
      const duration = Date.now() - start;

      if (site.expectStatus && res.status !== site.expectStatus) {
        issues.push(`🔴 ${site.name}: Expected ${site.expectStatus}, got ${res.status}`);
      } else if (duration > 10000) {
        issues.push(`🟡 ${site.name}: Slow response (${(duration/1000).toFixed(1)}s)`);
      }
    } catch (err) {
      issues.push(`🔴 ${site.name}: DOWN — ${err}`);
    }
  }

  if (issues.length > 0) {
    let msg = `<b>🚨 WEB HEALTH ALERT</b>\n\n`;
    issues.forEach(i => { msg += `${i}\n`; });
    msg += `\nChecked ${SITES.length} sites at ${new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York' })}`;
    await notify(msg);
  }

  logger.info(`Web check complete: ${issues.length} issues from ${SITES.length} sites`);
}
