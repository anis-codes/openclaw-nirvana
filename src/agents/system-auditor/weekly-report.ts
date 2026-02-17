import { supabase } from '../../supabase';
import { notify } from '../../shared/bot';
import { logAction } from '../../shared/log-action';

export async function generateWeeklyReport(): Promise<void> {
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();

  // 1. Total API cost this week
  const { data: costs } = await supabase
    .from('agent_cost_log')
    .select('agent, estimated_cost_usd')
    .gte('created_at', weekAgo);

  const totalCost = costs?.reduce((s, r) => s + Number(r.estimated_cost_usd), 0) ?? 0;
  const costByAgent = new Map<string, number>();
  costs?.forEach(r => {
    costByAgent.set(r.agent, (costByAgent.get(r.agent) ?? 0) + Number(r.estimated_cost_usd));
  });

  // 2. Revenue this week
  const { data: revenue } = await supabase
    .from('revenue_events')
    .select('amount_usd, primary_agent')
    .gte('created_at', weekAgo);
  const totalRevenue = revenue?.reduce((s, r) => s + Number(r.amount_usd), 0) ?? 0;

  // 3. Human time this week
  const { data: humanTime } = await supabase
    .from('human_time_log')
    .select('minutes_spent')
    .gte('created_at', weekAgo);
  const totalMinutes = humanTime?.reduce((s, r) => s + Number(r.minutes_spent), 0) ?? 0;

  // 4. Error count this week
  const { count: errors } = await supabase
    .from('agent_logs')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', weekAgo)
    .not('error', 'is', null);

  // 5. Build report
  let report = `<b>\u{1F4CA} WEEKLY SYSTEM REPORT</b>\n\n`;
  report += `<b>Revenue:</b> $${totalRevenue.toFixed(2)}\n`;
  report += `<b>API Cost:</b> $${totalCost.toFixed(4)}\n`;
  report += `<b>Simple ROI:</b> ${totalCost > 0 ? (totalRevenue / totalCost).toFixed(1) : 'N/A'}x\n`;
  report += `<b>Human Time:</b> ${totalMinutes.toFixed(0)} min\n`;
  report += `<b>Errors:</b> ${errors ?? 0}\n\n`;
  report += `<b>Cost by Agent:</b>\n`;
  costByAgent.forEach((cost, agent) => {
    report += `  \u2022 ${agent}: $${cost.toFixed(4)}\n`;
  });

  await notify(report);
  await logAction({ agent: 'system-auditor', action: 'weekly_report',
    metadata: { totalCost, totalRevenue, totalMinutes, errors } });
}
