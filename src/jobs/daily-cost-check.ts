import { supabase } from '../supabase';
import { notify } from '../shared/bot';

const DAILY_BUDGET_USD = 15;

export async function checkDailyCost(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('agent_cost_log')
    .select('estimated_cost_usd')
    .gte('created_at', today);
  const total = data?.reduce((s, r) => s + Number(r.estimated_cost_usd), 0) ?? 0;

  if (total > DAILY_BUDGET_USD * 0.8) {
    await notify(`\u{1F7E1} <b>BUDGET WARNING:</b> $${total.toFixed(2)} / $${DAILY_BUDGET_USD} today`);
  }
  if (total > DAILY_BUDGET_USD) {
    await notify(`\u{1F534} <b>BUDGET EXCEEDED:</b> $${total.toFixed(2)} / $${DAILY_BUDGET_USD} today`);
  }
}
