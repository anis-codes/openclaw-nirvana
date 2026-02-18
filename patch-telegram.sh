#!/bin/bash
# Run from openclaw-nirvana directory: bash patch-telegram.sh

# Add imports after the first line
sed -i '' '1s/^/import { getClientDashboard, updateClientContact, updateClientAction } from "..\/agents\/nirvana-pa\/clients";\
import { logProposalFeedback } from "..\/agents\/upwork-bd\/proposal-feedback";\
/' src/shared/telegram.ts

# Find the line number of "export { bot, notify }"
EXPORT_LINE=$(grep -n "export { bot, notify }" src/shared/telegram.ts | cut -d: -f1)

# Insert new commands before the export line
sed -i '' "${EXPORT_LINE}i\\
\\
bot.command(\"clients\", async (ctx) => {\\
  try { ctx.reply(await getClientDashboard(), { parse_mode: \"HTML\" }); }\\
  catch (err) { ctx.reply(\"Error: \" + err); }\\
});\\
\\
bot.command(\"contacted\", async (ctx) => {\\
  const q = ctx.match;\\
  if (!q) return ctx.reply(\"Usage: /contacted CLIENT [YYYY-MM-DD]\");\\
  const parts = q.split(/\\\\s+/);\\
  try { ctx.reply(await updateClientContact(parts[0], parts[1])); }\\
  catch (err) { ctx.reply(\"Error: \" + err); }\\
});\\
\\
bot.command(\"nextaction\", async (ctx) => {\\
  const q = ctx.match;\\
  if (!q) return ctx.reply(\"Usage: /nextaction CLIENT description\");\\
  const i = q.indexOf(\" \");\\
  if (i === -1) return ctx.reply(\"Usage: /nextaction CLIENT description\");\\
  try { ctx.reply(await updateClientAction(q.slice(0, i), q.slice(i + 1))); }\\
  catch (err) { ctx.reply(\"Error: \" + err); }\\
});\\
\\
bot.command(\"rejectreason\", async (ctx) => {\\
  const q = ctx.match;\\
  if (!q) return ctx.reply(\"Usage: /rejectreason why you rejected the last proposal\");\\
  logProposalFeedback(\"rejected\", \"see approval\", q);\\
  ctx.reply(\"Feedback logged. Future proposals will learn from this.\");\\
});\\
" src/shared/telegram.ts

echo "✅ Patched telegram.ts with /clients /contacted /nextaction /rejectreason"
