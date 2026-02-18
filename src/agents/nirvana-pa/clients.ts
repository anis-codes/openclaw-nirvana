import { supabase } from '../../supabase';

export async function getClientDashboard(): Promise<string> {
  const { data: clients } = await supabase
    .from('client_contacts')
    .select('*')
    .eq('status', 'active')
    .order('last_contact', { ascending: false });

  if (!clients?.length) return 'No active clients found.';

  const { data: unbilled } = await supabase
    .from('billable_hours')
    .select('client, hours, amount_usd')
    .eq('invoiced', false);

  const unbilledMap = new Map<string, { hours: number; amount: number }>();
  unbilled?.forEach(r => {
    const curr = unbilledMap.get(r.client) || { hours: 0, amount: 0 };
    curr.hours += Number(r.hours);
    curr.amount += Number(r.amount_usd);
    unbilledMap.set(r.client, curr);
  });

  let msg = `<b>👥 CLIENT DASHBOARD</b>\n\n`;

  for (const c of clients) {
    const daysSince = c.last_contact
      ? Math.floor((Date.now() - new Date(c.last_contact).getTime()) / 86400000)
      : null;

    const health = daysSince !== null ? Math.max(0, 100 - (daysSince * 10)) : 0;
    const healthEmoji = health >= 70 ? '🟢' : health >= 40 ? '🟡' : '🔴';

    const ub = unbilledMap.get(c.client);

    msg += `${healthEmoji} <b>${c.client}</b>`;
    if (c.contact_name) msg += ` (${c.contact_name})`;
    msg += `\n`;
    if (c.rate_usd) msg += `  Rate: $${c.rate_usd}/hr | ${c.platform}\n`;
    if (daysSince !== null) msg += `  Last contact: ${daysSince}d ago\n`;
    if (ub) msg += `  <b>Unbilled: ${ub.hours}h = $${ub.amount.toFixed(2)}</b>\n`;
    if (c.next_action) msg += `  ⚡ Next: ${c.next_action}\n`;
    if (c.notes) msg += `  📝 ${c.notes}\n`;
    msg += `\n`;
  }

  return msg;
}

export async function updateClientContact(client: string, date?: string): Promise<string> {
  const contactDate = date || new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('client_contacts')
    .update({ last_contact: contactDate })
    .ilike('client', `%${client}%`);

  if (error) return `Error: ${error.message}`;
  return `✅ Updated ${client} last contact to ${contactDate}`;
}

export async function updateClientAction(client: string, action: string): Promise<string> {
  const { error } = await supabase
    .from('client_contacts')
    .update({ next_action: action })
    .ilike('client', `%${client}%`);

  if (error) return `Error: ${error.message}`;
  return `✅ Updated ${client} next action: ${action}`;
}
