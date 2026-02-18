import { supabase } from '../supabase';
import { notify } from '../shared/bot';
import { logger } from '../logger';

export async function sendEveningReflection(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { data: logs } = await supabase
    .from('agent_logs')
    .select('agent, task_type, created_at')
    .gte('created_at', today);

  const agentTasks = new Map<string, string[]>();
  logs?.forEach(r => {
    const tasks = agentTasks.get(r.agent) || [];
    tasks.push(r.task_type);
    agentTasks.set(r.agent, tasks);
  });

  const { data: costs } = await supabase
    .from('agent_cost_log')
    .select('estimated_cost_usd')
    .gte('created_at', today);
  const todayCost = costs?.reduce((s, r) => s + Number(r.estimated_cost_usd), 0) ?? 0;

  const { data: billed } = await supabase
    .from('billable_hours')
    .select('client, hours, amount_usd')
    .gte('created_at', today);

  let billedMsg = '';
  let billedTotal = 0;
  billed?.forEach(r => {
    billedMsg += `  • ${r.client}: ${r.hours}h = $${Number(r.amount_usd).toFixed(2)}\n`;
    billedTotal += Number(r.amount_usd);
  });

  const { data: proposals } = await supabase
    .from('agent_logs')
    .select('id')
    .eq('task_type', 'proposal_generation')
    .gte('created_at', today);

  let msg = `<b>🌙 EVENING REFLECTION</b>\n`;
  msg += `${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\n`;

  msg += `<b>📊 Today's Activity:</b>\n`;
  if (agentTasks.size > 0) {
    agentTasks.forEach((tasks, agent) => {
      msg += `  • ${agent}: ${tasks.length} tasks (${[...new Set(tasks)].join(', ')})\n`;
    });
  } else {
    msg += `  No agent activity today\n`;
  }
  msg += '\n';

  msg += `<b>💰 Revenue Logged Today:</b> $${billedTotal.toFixed(2)}\n`;
  if (billedMsg) msg += billedMsg;
  msg += '\n';

  msg += `<b>🤖 API Spend:</b> $${todayCost.toFixed(4)}\n`;
  msg += `<b>📝 Proposals Generated:</b> ${proposals?.length ?? 0}\n\n`;

  msg += `<b>🎯 TOMORROW PREP:</b>\n`;
  msg += `  • /logtime to capture any untracked hours\n`;
  msg += `  • /scan for overnight Upwork jobs\n`;
  msg += `  • /briefing will fire at 7 AM\n`;

  await notify(msg);
  logger.info('Evening reflection sent');
}
