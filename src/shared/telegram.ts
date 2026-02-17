import { bot, notify } from './bot';
import { logger } from '../logger';
import { generateProposal } from '../agents/upwork-bd/generate-proposal';
import { requestApproval } from './approval';
import { scanJobs } from '../agents/upwork-bd/scanner';
import { generateWeeklyReport } from '../agents/system-auditor/weekly-report';
import { sfQuery, sfDebug, sfAsk } from '../agents/sfdc-ops/index';
import { hsWorkflow, hsDebug, hsAsk } from '../agents/hspot-ops/index';
import { paDraft, paPrioritize, paAsk } from '../agents/nirvana-pa/index';

// /start
bot.command('start', (ctx) => {
  ctx.reply('\u2705 OpenClaw Command Center active.\nUse /help to see all commands.');
});

// /help
bot.command('help', (ctx) => {
  ctx.reply(
    `<b>\u{1F3AE} OpenClaw Commands</b>\n\n` +
    `<b>System:</b>\n` +
    `/health - Uptime + memory\n` +
    `/report - Weekly cost/revenue report\n\n` +
    `<b>Upwork (UPWORK-BD):</b>\n` +
    `/proposal &lt;job text&gt; - Generate proposal\n` +
    `/scan - Scan job feeds\n\n` +
    `<b>Salesforce (SFDC-OPS):</b>\n` +
    `/soql &lt;request&gt; - Generate SOQL\n` +
    `/sfdebug &lt;error&gt; - Debug SF issue\n` +
    `/sf &lt;question&gt; - General SF help\n\n` +
    `<b>HubSpot (HSPOT-OPS):</b>\n` +
    `/hsflow &lt;request&gt; - Design workflow\n` +
    `/hsdebug &lt;error&gt; - Debug HS issue\n` +
    `/hs &lt;question&gt; - General HS help\n\n` +
    `<b>Assistant (NIRVANA-PA):</b>\n` +
    `/draft &lt;request&gt; - Draft message/email\n` +
    `/prioritize &lt;tasks&gt; - Prioritize work\n` +
    `/pa &lt;anything&gt; - General assistant`,
    { parse_mode: 'HTML' }
  );
});

// /health
bot.command('health', async (ctx) => {
  const uptime = Math.floor(process.uptime());
  const mem = Math.floor(process.memoryUsage().heapUsed / 1024 / 1024);
  ctx.reply(`<b>System Health</b>\n\u2022 Uptime: ${uptime}s\n\u2022 Memory: ${mem}MB`,
    { parse_mode: 'HTML' });
});

// UPWORK-BD
bot.command('proposal', async (ctx) => {
  const jobText = ctx.match;
  if (!jobText || jobText.length < 20) return ctx.reply('Usage: /proposal <paste full job description>');
  ctx.reply('\u{1F504} Generating proposal...');
  try {
    const proposal = await generateProposal(jobText);
    await requestApproval({
      agent: 'upwork-bd',
      actionType: 'submit_proposal',
      summary: proposal.slice(0, 500),
      fullContent: proposal,
      onApprove: async () => { logger.info('Proposal approved', { proposal: proposal.slice(0, 100) }); },
      onReject: async () => { logger.info('Proposal rejected'); },
    });
  } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
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

// SFDC-OPS
bot.command('soql', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /soql <describe what you need>');
  ctx.reply('\u{1F50D} Generating SOQL...');
  try { ctx.reply(await sfQuery(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('sfdebug', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /sfdebug <paste error or describe issue>');
  ctx.reply('\u{1F527} Analyzing...');
  try { ctx.reply(await sfDebug(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('sf', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /sf <your Salesforce question>');
  ctx.reply('\u{1F4AD} Thinking...');
  try { ctx.reply(await sfAsk(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

// HSPOT-OPS
bot.command('hsflow', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /hsflow <describe workflow need>');
  ctx.reply('\u{1F504} Designing workflow...');
  try { ctx.reply(await hsWorkflow(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('hsdebug', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /hsdebug <paste error or describe issue>');
  ctx.reply('\u{1F527} Analyzing...');
  try { ctx.reply(await hsDebug(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('hs', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /hs <your HubSpot question>');
  ctx.reply('\u{1F4AD} Thinking...');
  try { ctx.reply(await hsAsk(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

// NIRVANA-PA
bot.command('draft', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /draft <describe what to draft>');
  ctx.reply('\u{270D}\u{FE0F} Drafting...');
  try { ctx.reply(await paDraft(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('prioritize', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 10) return ctx.reply('Usage: /prioritize <list your tasks or context>');
  ctx.reply('\u{1F4CB} Prioritizing...');
  try { ctx.reply(await paPrioritize(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

bot.command('pa', async (ctx) => {
  const q = ctx.match;
  if (!q || q.length < 5) return ctx.reply('Usage: /pa <your request>');
  ctx.reply('\u{1F4AD} On it...');
  try { ctx.reply(await paAsk(q)); } catch (err) { ctx.reply(`\u274C Error: ${err}`); }
});

export { bot, notify };
