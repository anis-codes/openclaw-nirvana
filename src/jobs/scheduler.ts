import cron from 'node-cron';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { generateWeeklyReport } from '../agents/system-auditor/weekly-report';
import { checkDailyCost } from './daily-cost-check';
import { logger } from '../logger';

export function startScheduler(): void {
  // Scan Upwork every 2 hours, 6 AM – 10 PM ET
  cron.schedule('0 6,8,10,12,14,16,18,20,22 * * *', async () => {
    logger.info('Running scheduled Upwork scan');
    await scanJobs();
  }, { timezone: 'America/New_York' });

  // Weekly report: Sunday 5 PM ET
  cron.schedule('0 17 * * 0', async () => {
    logger.info('Generating weekly report');
    await generateWeeklyReport();
  }, { timezone: 'America/New_York' });

  // Daily cost check: every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    await checkDailyCost();
  });

  logger.info('Scheduler started: scans, reports, cost checks');
}
