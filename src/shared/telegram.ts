import { bot, notify } from './bot';
import { logger } from '../logger';
import { generateProposal } from '../agents/upwork-bd/generate-proposal';
import { requestApproval } from './approval';

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

export { bot, notify };
