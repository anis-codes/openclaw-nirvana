import cron from 'node-cron';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { logger } from '../logger';

export function startScheduler(): void {
  // Scan Upwork every 2 hours, 6 AM – 10 PM ET
  cron.schedule('0 6,8,10,12,14,16,18,20,22 * * *', async () => {
    logger.info('Running scheduled Upwork scan');
    await scanJobs();
  }, { timezone: 'America/New_York' });

  logger.info('Scheduler started: Upwork scan every 2 hours');
}
