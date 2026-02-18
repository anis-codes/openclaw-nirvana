import cron from 'node-cron';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { generateWeeklyReport } from '../agents/system-auditor/weekly-report';
import { checkDailyCost } from './daily-cost-check';
import { sendMorningBriefing } from './morning-briefing';
import { logger } from '../logger';

export function startScheduler(): void {
  cron.schedule('0 7 * * *', async () => {
    logger.info('Sending morning briefing');
    await sendMorningBriefing();
  }, { timezone: 'America/New_York' });

  cron.schedule('0 6,8,10,12,14,16,18,20,22 * * *', async () => {
    logger.info('Running scheduled Upwork scan');
    await scanJobs();
  }, { timezone: 'America/New_York' });

  cron.schedule('0 17 * * 0', async () => {
    logger.info('Generating weekly report');
    await generateWeeklyReport();
  }, { timezone: 'America/New_York' });

  cron.schedule('0 */4 * * *', async () => {
    await checkDailyCost();
  });

  logger.info('Scheduler started: briefings, scans, reports, cost checks');
}
