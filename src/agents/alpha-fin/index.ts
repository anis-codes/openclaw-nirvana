import { callClaude } from '../../shared/claude';
import { supabase } from '../../supabase';
import { ALPHA_FIN_SYSTEM_PROMPT } from './system-prompt';

export async function finAnalyze(query: string): Promise<string> {
  const result = await callClaude({
    agent: 'alpha-fin',
    taskType: 'market_analysis',
    systemPrompt: ALPHA_FIN_SYSTEM_PROMPT,
    userMessage: query,
    maxTokens: 2048,
  });
  return result.text;
}

export async function finTrade(idea: string): Promise<string> {
  const result = await callClaude({
    agent: 'alpha-fin',
    taskType: 'trade_idea',
    systemPrompt: ALPHA_FIN_SYSTEM_PROMPT,
    userMessage: `Generate a paper trade idea for:\n\n${idea}`,
    maxTokens: 1024,
  });
  return result.text;
}

export async function finOpenTrade(
  symbol: string, side: string, quantity: number,
  entryPrice: number, stopLoss: number, takeProfit: number, thesis: string
): Promise<string> {
  const { data, error } = await supabase.from('paper_trades').insert({
    symbol: symbol.toUpperCase(),
    side: side.toUpperCase(),
    quantity, entry_price: entryPrice,
    stop_loss: stopLoss, take_profit: takeProfit,
    thesis, status: 'open',
  }).select().single();

  if (error) return `Error opening trade: ${error.message}`;
  return `\u2705 Paper trade opened:\n` +
    `${data.side} ${data.quantity} ${data.symbol} @ $${data.entry_price}\n` +
    `SL: $${data.stop_loss} | TP: $${data.take_profit}\n` +
    `ID: ${data.id.slice(0, 8)}`;
}

export async function finCloseTrade(tradeId: string, exitPrice: number): Promise<string> {
  const { data: trade, error: fetchErr } = await supabase
    .from('paper_trades')
    .select('*')
    .ilike('id', `${tradeId}%`)
    .eq('status', 'open')
    .single();

  if (fetchErr || !trade) return 'Trade not found or already closed.';

  const pnl = trade.side === 'LONG'
    ? (exitPrice - trade.entry_price) * trade.quantity
    : (trade.entry_price - exitPrice) * trade.quantity;

  const { error } = await supabase.from('paper_trades').update({
    exit_price: exitPrice, pnl_usd: pnl,
    status: 'closed', closed_at: new Date().toISOString(),
  }).eq('id', trade.id);

  if (error) return `Error closing trade: ${error.message}`;
  const emoji = pnl >= 0 ? '\u{1F7E2}' : '\u{1F534}';
  return `${emoji} Paper trade closed:\n` +
    `${trade.side} ${trade.quantity} ${trade.symbol}\n` +
    `Entry: $${trade.entry_price} \u2192 Exit: $${exitPrice}\n` +
    `P&L: ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`;
}

export async function finPortfolio(): Promise<string> {
  const { data: open } = await supabase
    .from('paper_trades').select('*').eq('status', 'open');
  const { data: closed } = await supabase
    .from('paper_trades').select('pnl_usd').eq('status', 'closed');

  const totalPnl = closed?.reduce((s, r) => s + Number(r.pnl_usd), 0) ?? 0;
  const wins = closed?.filter(r => Number(r.pnl_usd) > 0).length ?? 0;
  const total = closed?.length ?? 0;
  const winRate = total > 0 ? ((wins / total) * 100).toFixed(1) : 'N/A';

  let msg = `<b>\u{1F4B0} Paper Portfolio</b>\n\n`;
  msg += `<b>Open Positions:</b> ${open?.length ?? 0}\n`;
  if (open?.length) {
    open.forEach(t => {
      msg += `  \u2022 ${t.side} ${t.quantity} ${t.symbol} @ $${t.entry_price} (ID: ${t.id.slice(0, 8)})\n`;
    });
  }
  msg += `\n<b>Closed Trades:</b> ${total}\n`;
  msg += `<b>Win Rate:</b> ${winRate}%\n`;
  msg += `<b>Total P&L:</b> ${totalPnl >= 0 ? '+' : ''}$${totalPnl.toFixed(2)}`;
  return msg;
}
