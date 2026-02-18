import { supabase } from '../supabase';
import { notify } from '../shared/bot';
import { logger } from '../logger';

export async function sendMorningBriefing(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  // 1. Unbilled hours by client
  const { data: unbilled } = await supabase
    .from('billable_hours')
    .select('client, hours, amount_usd')
    .eq('invoiced', false);

  const clientTotals = new Map<string, { hours: number; amount: number }>();
  unbilled?.forEach(r => {
    const curr = clientTotals.get(r.client) || { hours: 0, amount: 0 };
    curr.hours += Number(r.hours);
    curr.amount += Number(r.amount_usd);
    clientTotals.set(r.client, curr);
  });

  let unbilledTotal = 0;
  let unbilledMsg = '';
  clientTotals.forEach((v, k) => {
    unbilledMsg += `  • ${k}: ${v.hours}h = $${v.amount.toFixed(2)}\n`;
    unbilledTotal += v.amount;
  });

  // 2. Yesterday's API cost
  const { data: costs } = await supabase
    .from('agent_cost_log')
    .select('estimated_cost_usd')
    .gte('created_at', yesterday)
    .lt('created_at', today);
  const yesterdayCost = costs?.reduce((s, r) => s + Number(r.estimated_cost_usd), 0) ?? 0;

  // 3. Yesterday's agent activity
  const { data: logs } = await supabase
    .from('agent_logs')
    .select('agent, task_type')
    .gte('created_at', yesterday)
    .lt('created_at', today);

  const agentCounts = new Map<string, number>();
  logs?.forEach(r => {
    agentCounts.set(r.agent, (agentCounts.get(r.agent) ?? 0) + 1);
  });

  let activityMsg = '';
  agentCounts.forEach((count, agent) => {
    activityMsg += `  • ${agent}: ${count} tasks\n`;
  });

  // 4. Open paper trades
  const { data: openTrades } = await supabase
    .from('paper_trades')
    .select('symbol, side, entry_price')
    .eq('status', 'open');

  let tradesMsg = '';
  if (openTrades?.length) {
    openTrades.forEach(t => {
      tradesMsg += `  • ${t.side} ${t.symbol} @ $${t.entry_price}\n`;
    });
  }

  // 5. Build briefing
  let msg = `<b>☀️ MORNING BRIEFING</b>\n`;
  msg += `${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\n`;

  msg += `<b>💰 Unbilled Revenue:</b> $${unbilledTotal.toFixed(2)}\n`;
  if (unbilledMsg) msg += unbilledMsg;
  msg += '\n';

  msg += `<b>🤖 Yesterday's API Cost:</b> $${yesterdayCost.toFixed(4)}\n`;
  if (activityMsg) {
    msg += `<b>📊 Agent Activity:</b>\n${activityMsg}\n`;
  } else {
    msg += `<b>📊 Agent Activity:</b> None yesterday\n\n`;
  }

  if (tradesMsg) {
    msg += `<b>📈 Open Trades:</b>\n${tradesMsg}\n`;
  }

  msg += `<b>⚡ Quick Actions:</b>\n`;
  msg += `  /unbilled - Full breakdown\n`;
  msg += `  /scan - Check new Upwork jobs\n`;
  msg += `  /portfolio - Trade positions`;

  await notify(msg);
  logger.info('Morning briefing sent');
}
