#!/bin/bash
# Run from openclaw-nirvana directory: bash patch-telegram-final.sh

# Add imports at top of file
sed -i '' '1s/^/import { addTask, listTasks, completeTask } from "..\/agents\/nirvana-pa\/tasks";\
import { scanEmails } from "..\/agents\/nirvana-pa\/email-scanner";\
import { sendEveningReflection } from "..\/jobs\/evening-reflection";\
import { runWebChecks } from "..\/jobs\/web-check";\
/' src/shared/telegram.ts

# Find export line number
EXPORT_LINE=$(grep -n "export { bot, notify }" src/shared/telegram.ts | cut -d: -f1)

# Create a temp file with the new commands
cat > /tmp/new_commands.txt << 'CMDS'

bot.command("task", async (ctx) => {
  const q = ctx.match;
  if (!q) return ctx.reply("Usage: /task [mine|theirs] CLIENT title");
  const parts = q.split(/\s+/);
  const owner = (parts[0] === "mine" || parts[0] === "theirs") ? parts.shift()! : "mine";
  const hasClient = ["MTM", "PE", "MLT"].includes((parts[0] || "").toUpperCase());
  const client = hasClient ? parts.shift()!.toUpperCase() : undefined;
  const title = parts.join(" ");
  if (!title) return ctx.reply("Need a task title.");
  try { ctx.reply(await addTask(title, owner as any, client)); }
  catch (err) { ctx.reply("Error: " + err); }
});

bot.command("tasks", async (ctx) => {
  const q = ctx.match || undefined;
  try { ctx.reply(await listTasks(q), { parse_mode: "HTML" }); }
  catch (err) { ctx.reply("Error: " + err); }
});

bot.hears(/^\/done_(\w+)/, async (ctx) => {
  const shortId = ctx.match![1];
  try { ctx.reply(await completeTask(shortId)); }
  catch (err) { ctx.reply("Error: " + err); }
});

bot.command("emailscan", async (ctx) => {
  ctx.reply("Scanning inbox...");
  try { await scanEmails(); ctx.reply("Email scan complete."); }
  catch (err) { ctx.reply("Error: " + err); }
});

bot.command("reflection", async (ctx) => {
  ctx.reply("Generating evening reflection...");
  try { await sendEveningReflection(); }
  catch (err) { ctx.reply("Error: " + err); }
});

bot.command("webcheck", async (ctx) => {
  ctx.reply("Checking sites...");
  try { await runWebChecks(); ctx.reply("Web check complete."); }
  catch (err) { ctx.reply("Error: " + err); }
});

CMDS

# Insert the commands before the export line
sed -i '' "$((EXPORT_LINE - 1))r /tmp/new_commands.txt" src/shared/telegram.ts

rm /tmp/new_commands.txt

echo "✅ Patched: /task /tasks /done_ /emailscan /reflection /webcheck added"
