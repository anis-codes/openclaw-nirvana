import { bot, notify } from './bot';
import { logger } from '../logger';
import { generateProposal } from '../agents/upwork-bd/generate-proposal';
import { requestApproval } from './approval';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { generateWeeklyReport } from '../agents/system-auditor/weekly-report';
import { sfQuery, sfDebug, sfAsk } from '../agents/sfdc-ops/index';
import { hsWorkflow, hsDebug, hsAsk } from '../agents/hspot-ops/index';
import { paDraft, paPrioritize, paAsk } from '../agents/nirvana-pa/index';
import { ceLinkedIn, ceBlog, ceIdeas } from '../agents/content-engine/index';
import { finAnalyze, finTrade, finOpenTrade, finCloseTrade, finPortfolio } from '../agents/alpha-fin/index';
import { logTime, getUnbilled, markInvoiced } from '../agents/nirvana-pa/billing';

bot.command('start', (ctx) => {
  ctx.reply('\u2705 OpenClaw Command Center active.\nUse /help to see all commands.');
});

bot.command('help', (ctx) => {
  ctx.reply(
    '<b>\u{1F3AE} OpenClaw Commands</b>\n\n' +
    '<b>System:</b>\n' +
    '/health - Uptime + memory\n' +
    '/report - Weekly cost/revenue report\n\n' +
    '<b>Upwork (UPWORK-BD):</b>\n' +
    '/proposal - Generate proposal\n' +
    '/scan - Scan job feeds\n\n' +
    '<b>Salesforce (SFDC-OPS):</b>\n' +
    '/soql - Generate SOQL\n' +
    '/sfdebug - Debug SF issue\n' +
    '/sf - General SF help\n\n' +
    '<b>HubSpot (HSPOT-OPS):</b>\n' +
    '/hsflow - Design workflow\n' +
    '/hsdebug - Debug HS issue\n' +
    '/hs - General HS help\n\n' +
    '<b>Assistant (NIRVANA-PA):</b>\n' +
    '/draft - Draft message/email\n' +
    '/prioritize - Prioritize work\n' +
    '/pa - General assistant\n\n' +
    '<b>Content (CONTENT-ENGINE):</b>\n' +
    '/linkedin - LinkedIn post\n' +
    '/blog - Blog post\n' +
    '/ideas - Content ideas\n\n' +
    '<b>Trading (ALPHA-FIN):</b>\n' +
    '/analyze - Market analysis\n' +
    '/trade - Generate trade idea\n' +
    '/opentrade - Open paper trade\n' +
    '/closetrade - Close paper trade\n' +
    '/portfolio - View positions\n\n' +
    '<b>Billing:</b>\n' +
    '/logtime - Log billable hours\n' +
    '/unbilled - View unbilled hours\n' +
    '/invoiced - Mark as invoiced',
    { parse_mode: 'HTML' }
  );
});

bot.command('health', async (ctx) => {
  const uptime = Math.floor(process.uptime());
  const mem = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
  ctx.reply('<b>System Health</b>\n\u2022 Uptime: ' + uptime + 's\n\u2022 Memory: ' + mem + 'MB', { parse_mode: 'HTML' });
});

bot.command('proposal', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 20) return ctx.reply('Usage: /proposal <paste full job description>');
  ctx.reply('\u{1F504} Generating proposal...');
  try {
    const proposal = await generateProposal(q);
    await requestApproval({
      agent: 'upwork-bd', actionType: 'submit_proposal',
      summary: proposal.slice(0, 500), fullContent: proposal,
      onApprove: async () => { logger.info('Proposal approved'); },
      onReject: async () => { logger.info('Proposal rejected'); },
    });
  } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('scan', async (ctx) => {
  ctx.reply('\u{1F50D} Scanning Upwork feeds...');
  await scanJobs();
  ctx.reply('\u2705 Scan complete.');
});

bot.command('report', async (ctx) => {
  ctx.reply('Generating report...');
  await generateWeeklyReport();
});

bot.command('soql', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /soql <describe what you need>');
  ctx.reply('\u{1F50D} Generating SOQL...');
  try { ctx.reply(await sfQuery(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('sfdebug', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /sfdebug <paste error or describe issue>');
  ctx.reply('\u{1F527} Analyzing...');
  try { ctx.reply(await sfDebug(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('sf', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /sf <your Salesforce question>');
  ctx.reply('\u{1F4AD} Thinking...');
  try { ctx.reply(await sfAsk(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('hsflow', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /hsflow <describe workflow need>');
  ctx.reply('\u{1F504} Designing workflow...');
  try { ctx.reply(await hsWorkflow(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('hsdebug', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /hsdebug <paste error or describe issue>');
  ctx.reply('\u{1F527} Analyzing...');
  try { ctx.reply(await hsDebug(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('hs', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /hs <your HubSpot question>');
  ctx.reply('\u{1F4AD} Thinking...');
  try { ctx.reply(await hsAsk(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('draft', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /draft <describe what to draft>');
  ctx.reply('\u{270D}\u{FE0F} Drafting...');
  try { ctx.reply(await paDraft(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('prioritize', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /prioritize <list your tasks or context>');
  ctx.reply('\u{1F4CB} Prioritizing...');
  try { ctx.reply(await paPrioritize(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('pa', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /pa <your request>');
  ctx.reply('\u{1F4AD} On it...');
  try { ctx.reply(await paAsk(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('linkedin', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /linkedin <topic or angle>');
  ctx.reply('\u{1F4DD} Writing LinkedIn post...');
  try { ctx.reply(await ceLinkedIn(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('blog', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /blog <topic>');
  ctx.reply('\u{1F4DD} Writing blog post...');
  try { ctx.reply(await ceBlog(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('ideas', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /ideas <context or theme>');
  ctx.reply('\u{1F4A1} Generating ideas...');
  try { ctx.reply(await ceIdeas(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('analyze', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 3) return ctx.reply('Usage: /analyze <ticker or market question>');
  ctx.reply('\u{1F4C8} Analyzing...');
  try { ctx.reply(await finAnalyze(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('trade', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 3) return ctx.reply('Usage: /trade <ticker or setup>');
  ctx.reply('\u{1F4CA} Generating trade idea...');
  try { ctx.reply(await finTrade(q)); } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('opentrade', async (ctx) => {
  const q = ctx.match;
  if (!q) return ctx.reply('Usage: /opentrade AAPL LONG 10 185.50 180 195 "breakout above resistance"');
  const parts = q.match(/(\w+)\s+(LONG|SHORT)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+"(.+)"/i);
  if (!parts) return ctx.reply('Format: /opentrade SYMBOL SIDE QTY ENTRY STOP TARGET "thesis"');
  try {
    const result = await finOpenTrade(parts[1], parts[2], Number(parts[3]), Number(parts[4]), Number(parts[5]), Number(parts[6]), parts[7]);
    ctx.reply(result);
  } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('closetrade', async (ctx) => {
  const q = ctx.match;
  if (!q) return ctx.reply('Usage: /closetrade <trade-id> <exit-price>');
  const parts = q.split(/\s+/);
  if (parts.length < 2) return ctx.reply('Usage: /closetrade <trade-id> <exit-price>');
  try {
    const result = await finCloseTrade(parts[0], Number(parts[1]));
    ctx.reply(result);
  } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('portfolio', async (ctx) => {
  try { ctx.reply(await finPortfolio(), { parse_mode: 'HTML' }); }
  catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('logtime', async (ctx) => {
  const q = ctx.match;
  if (!q) return ctx.reply('Usage: /logtime MTM 3 45 "IP flow work and trigger testing"');
  const parts = q.match(/(\S+)\s+([\d.]+)\s+([\d.]+)\s+"(.+)"/);
  if (!parts) return ctx.reply('Format: /logtime CLIENT HOURS RATE "description"');
  try {
    ctx.reply(await logTime(parts[1], Number(parts[2]), Number(parts[3]), parts[4]));
  } catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('unbilled', async (ctx) => {
  try { ctx.reply(await getUnbilled(), { parse_mode: 'HTML' }); }
  catch (err) { ctx.reply('\u274C Error: ' + err); }
});

bot.command('invoiced', async (ctx) => {
  const client = ctx.match;
  if (!client) return ctx.reply('Usage: /invoiced CLIENT_NAME');
  try { ctx.reply(await markInvoiced(client)); }
  catch (err) { ctx.reply('\u274C Error: ' + err); }
});

export { bot, notify };
