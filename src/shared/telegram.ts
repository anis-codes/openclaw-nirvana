import { bot, notify } from './bot';
import { logger } from '../logger';
import { generateProposal } from '../agents/upwork-bd/generate-proposal';
import { requestApproval } from './approval';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { generateWeeklyReport } from '../agents/system-auditor/weekly-report';
import { sfQuery, sfDebug, sfAsk } from '../agents/sfdc-ops/index';
import { hsWorkflow, hsDebug, hsAsk } from '../agents/hspot-ops/index';

// /start
bot.command('start', (ctx) => {
  ctx.reply('\u2705 OpenClaw Command Center active.\nUse /health to check system status.');
});

// /health
bot.command('health', async (ctx) => {
  const uptime = Math.floor(process.uptime());
  const mem = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
  ctx.reply(`<b>System Health</b>\n\u2022 Uptime: ${uptime}s\n\u2022 Memory: ${mem}MB`,
    { parse_mode: 'HTML' });
});

// /proposal <job description>
bot.command('proposal', async (ctx) => {
  const jobText = ctx.match;
  if (!jobText || jobText.length < 20) {
    return ctx.reply('Usage: /proposal <paste full job description>');
  }
  ctx.reply('\u{1F504} Generating proposal...');
  try {
    const proposal = await generateProposal(jobText);
    await requestApproval({
      agent: 'upwork-bd',
      actionType: 'submit_proposal',
      summary: proposal.slice(0, 500),
      fullContent: proposal,
      onApprove: async () => {
        logger.info('Proposal approved', { proposal: proposal.slice(0, 100) });
      },
      onReject: async () => {
        logger.info('Proposal rejected');
      },
    });
  } catch (err) {
    ctx.reply(`\u274C Error: ${err}`);
  }
});

// /scan - manual job scan
bot.command('scan', async (ctx) => {
  ctx.reply('\u{1F50D} Scanning Upwork feeds...');
  await scanJobs();
  ctx.reply('\u2705 Scan complete.');
});

// /report - on-demand weekly report
bot.command('report', async (ctx) => {
  ctx.reply('Generating report...');
  await generateWeeklyReport();
});

// SFDC-OPS commands
bot.command('soql', async (ctx) => {
  const question = ctx.match;
  if (!question || question.length < 5) return ctx.reply('Usage: /soql <describe what you need>');
  ctx.reply('\u{1F50D} Generating SOQL...');
  try { ctx.reply(await sfQuery(question)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('sfdebug', async (ctx) => {
  const issue = ctx.match;
  if (!issue || issue.length < 10) return ctx.reply('Usage: /sfdebug <paste error or describe issue>');
  ctx.reply('\u{1F527} Analyzing...');
  try { ctx.reply(await sfDebug(issue)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('sf', async (ctx) => {
  const question = ctx.match;
  if (!question || question.length < 5) return ctx.reply('Usage: /sf <your Salesforce question>');
  ctx.reply('\u{1F4AD} Thinking...');
  try { ctx.reply(await sfAsk(question)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

// HSPOT-OPS commands
bot.command('hsflow', async (ctx) => {
  const question = ctx.match;
  if (!question || question.length < 5) return ctx.reply('Usage: /hsflow <describe workflow need>');
  ctx.reply('\u{1F504} Designing workflow...');
  try { ctx.reply(await hsWorkflow(question)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('hsdebug', async (ctx) => {
  const issue = ctx.match;
  if (!issue || issue.length < 10) return ctx.reply('Usage: /hsdebug <paste error or describe issue>');
  ctx.reply('\u{1F527} Analyzing...');
  try { ctx.reply(await hsDebug(issue)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('hs', async (ctx) => {
  const question = ctx.match;
  if (!question || question.length < 5) return ctx.reply('Usage: /hs <your HubSpot question>');
  ctx.reply('\u{1F4AD} Thinking...');
  try { ctx.reply(await hsAsk(question)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

export { bot, notify };
