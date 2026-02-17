import { Bot } from 'grammy';
import { config } from '../config';
import { logger } from '../logger';

export const bot = new Bot(config.TELEGRAM_BOT_TOKEN);

// Security: only respond to YOUR user ID
bot.use(async (ctx, next) => {
  const userId = String(ctx.from?.id);
  if (userId !== config.TELEGRAM_USER_ID) {
    logger.warn('Unauthorized Telegram access attempt', { userId });
    return;
  }
  await next();
});

// Helper: send message to Anis
export async function notify(text: string): Promise<void> {
  try {
    await bot.api.sendMessage(config.TELEGRAM_USER_ID, text, {
      parse_mode: 'HTML',
    });
  } catch (err) {
    logger.error('Failed to send Telegram notification', { err });
  }
}

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
