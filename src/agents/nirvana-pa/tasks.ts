import { supabase } from '../../supabase';

export async function addTask(title: string, owner: 'mine' | 'theirs', client?: string, dueDate?: string): Promise<string> {
  const { error } = await supabase.from('tasks').insert({
    title,
    owner,
    client: client || null,
    due_date: dueDate || null,
  });
  if (error) return `Error: ${error.message}`;
  const emoji = owner === 'mine' ? '✅' : '⏳';
  return `${emoji} Task added (${owner}): ${title}${client ? ` [${client}]` : ''}${dueDate ? ` due ${dueDate}` : ''}`;
}

export async function listTasks(filter?: string): Promise<string> {
  let query = supabase.from('tasks').select('*').eq('status', 'open').order('created_at', { ascending: false });

  if (filter === 'mine' || filter === 'theirs') {
    query = query.eq('owner', filter);
  } else if (filter) {
    query = query.ilike('client', `%${filter}%`);
  }

  const { data: tasks } = await query;
  if (!tasks?.length) return 'No open tasks found.';

  let msg = `<b>📋 TASKS${filter ? ` (${filter})` : ''}</b>\n\n`;

  const mine = tasks.filter(t => t.owner === 'mine');
  const theirs = tasks.filter(t => t.owner === 'theirs');

  if (mine.length) {
    msg += `<b>🔵 MINE (${mine.length}):</b>\n`;
    mine.forEach(t => {
      const due = t.due_date ? ` 📅 ${t.due_date}` : '';
      const client = t.client ? ` [${t.client}]` : '';
      msg += `  • ${t.title}${client}${due}\n`;
      msg += `    /done_${t.id.slice(0, 8)}\n`;
    });
    msg += '\n';
  }

  if (theirs.length) {
    msg += `<b>🟡 WAITING ON OTHERS (${theirs.length}):</b>\n`;
    theirs.forEach(t => {
      const due = t.due_date ? ` 📅 ${t.due_date}` : '';
      const client = t.client ? ` [${t.client}]` : '';
      msg += `  • ${t.title}${client}${due}\n`;
      msg += `    /done_${t.id.slice(0, 8)}\n`;
    });
  }

  return msg;
}

export async function completeTask(shortId: string): Promise<string> {
  const { data: tasks } = await supabase.from('tasks').select('*').eq('status', 'open');
  const match = tasks?.find(t => t.id.startsWith(shortId));
  if (!match) return 'Task not found.';

  const { error } = await supabase.from('tasks')
    .update({ status: 'done', completed_at: new Date().toISOString() })
    .eq('id', match.id);

  if (error) return `Error: ${error.message}`;
  return `✅ Completed: ${match.title}`;
}

export async function getOverdueTasks(): Promise<string[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase.from('tasks')
    .select('title, client, owner, due_date')
    .eq('status', 'open')
    .lt('due_date', today);

  if (!data?.length) return [];
  return data.map(t => `⚠️ OVERDUE: ${t.title}${t.client ? ` [${t.client}]` : ''} (${t.owner}) — was due ${t.due_date}`);
}
