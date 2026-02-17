import { supabase } from '../../supabase';

export async function logTime(
  client: string, hours: number, rate: number, description: string
): Promise<string> {
  const amount = hours * rate;
  const { error } = await supabase.from('billable_hours').insert({
    client, hours, rate_usd: rate, amount_usd: amount, description,
  });
  if (error) return `Error: ${error.message}`;
  return `\u2705 Logged: ${hours}h @ $${rate}/hr = $${amount.toFixed(2)}\nClient: ${client}\nWork: ${description}`;
}

export async function getUnbilled(): Promise<string> {
  const { data, error } = await supabase
    .from('billable_hours')
    .select('*')
    .eq('invoiced', false)
    .order('client')
    .order('created_at');

  if (error) return `Error: ${error.message}`;
  if (!data?.length) return 'No unbilled hours.';

  const byClient = new Map<string, { hours: number; amount: number; items: string[] }>();
  data.forEach(r => {
    const entry = byClient.get(r.client) ?? { hours: 0, amount: 0, items: [] };
    entry.hours += Number(r.hours);
    entry.amount += Number(r.amount_usd);
    entry.items.push(`  \u2022 ${r.hours}h - ${r.description} ($${Number(r.amount_usd).toFixed(2)})`);
    byClient.set(r.client, entry);
  });

  let msg = `<b>\u{1F4B5} Unbilled Hours</b>\n\n`;
  let grandTotal = 0;
  byClient.forEach((v, client) => {
    msg += `<b>${client}:</b> ${v.hours}h = $${v.amount.toFixed(2)}\n`;
    v.items.forEach(i => { msg += `${i}\n`; });
    msg += `\n`;
    grandTotal += v.amount;
  });
  msg += `<b>Grand Total: $${grandTotal.toFixed(2)}</b>`;
  return msg;
}

export async function markInvoiced(client: string): Promise<string> {
  const { data, error: fetchErr } = await supabase
    .from('billable_hours')
    .select('*')
    .eq('client', client)
    .eq('invoiced', false);

  if (fetchErr) return `Error: ${fetchErr.message}`;
  if (!data?.length) return `No unbilled hours for ${client}.`;

  const totalHours = data.reduce((s, r) => s + Number(r.hours), 0);
  const totalAmount = data.reduce((s, r) => s + Number(r.amount_usd), 0);
  const ids = data.map(r => r.id);

  const { error } = await supabase
    .from('billable_hours')
    .update({ invoiced: true, invoice_date: new Date().toISOString().split('T')[0] })
    .in('id', ids);

  if (error) return `Error: ${error.message}`;
  return `\u2705 Marked ${data.length} entries as invoiced for ${client}:\n${totalHours}h = $${totalAmount.toFixed(2)}`;
}
