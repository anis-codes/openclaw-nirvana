import cron from 'node-cron';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { generateWeeklyReport } from '../agents/system-auditor/weekly-report';
import { checkDailyCost } from './daily-cost-check';
import { sendMorningBriefing } from './morning-briefing';
import { sendEveningReflection } from './evening-reflection';
import { runWebChecks } from './web-check';
import { logger } from '../logger';

export function startScheduler(): void {
  // Morning briefing: 7 AM ET
  cron.schedule('0 7 * * *', async () => {
    logger.info('Sending morning briefing');
    await sendMorningBriefing();
  }, { timezone: 'America/New_York' });

  // Scan Upwork every 2 hours, 6 AM - 10 PM ET
  cron.schedule('0 6,8,10,12,14,16,18,20,22 * * *', async () => {
    logger.info('Running scheduled Upwork scan');
    await scanJobs();
  }, { timezone: 'America/New_York' });

  // Evening reflection: 10 PM ET (matches night owl schedule)
  cron.schedule('0 22 * * *', async () => {
    logger.info('Sending evening reflection');
    await sendEveningReflection();
  }, { timezone: 'America/New_York' });

  // Web health checks: every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    logger.info('Running web health checks');
    await runWebChecks();
  });

  // Weekly report: Sunday 5 PM ET
  cron.schedule('0 17 * * 0', async () => {
    logger.info('Generating weekly report');
    await generateWeeklyReport();
  }, { timezone: 'America/New_York' });

  // Daily cost check: every 4 hours
  cron.schedule('0 */4 * * *', async () => {
    await checkDailyCost();
  });


  // Email scan every 30 min during night owl hours (8 PM - 2 AM ET)
  cron.schedule("*/30 20-23,0-2 * * *", async () => {
    logger.info("Scanning emails");
    const { scanEmails } = await import("../agents/nirvana-pa/email-scanner");
    await scanEmails();
  }, { timezone: "America/New_York" });

  logger.info("Scheduler started: briefings, reflections, scans, web checks, email, reports, cost checks");

}

// Import and schedule email scanning
import { scanEmails } from '../agents/nirvana-pa/email-scanner';

// Scan emails every 30 min during work hours (8 PM - 2 AM ET)
cron.schedule('*/30 20-23,0-2 * * *', async () => {
  logger.info('Scanning emails');
  await scanEmails();
}, { timezone: 'America/New_York' });
