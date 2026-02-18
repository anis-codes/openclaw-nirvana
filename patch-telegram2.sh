#!/bin/bash
# Run from openclaw-nirvana directory: bash patch-telegram2.sh

# Add imports after line 1
sed -i '' '1s/^/import { runContentPipeline } from "..\/agents\/content-engine\/pipeline";\
import { scanUpworkTrends } from "..\/agents\/upwork-bd\/trends";\
/' src/shared/telegram.ts

# Find export line
EXPORT_LINE=$(grep -n "export { bot, notify }" src/shared/telegram.ts | cut -d: -f1)

# Insert commands
sed -i '' "${EXPORT_LINE}i\\
\\
bot.command(\"contentpipeline\", async (ctx) => {\\
  const q = ctx.match;\\
  if (!q || q.length < 5) return ctx.reply(\"Usage: /contentpipeline <topic>\");\\
  ctx.reply(\"Running content pipeline: research + write...\");\\
  try {\\
    const result = await runContentPipeline(q);\\
    ctx.reply(\"<b>Research:</b>\\\\n\" + result.ideas, { parse_mode: \"HTML\" });\\
    ctx.reply(\"<b>LinkedIn Post:</b>\\\\n\\\\n\" + result.post, { parse_mode: \"HTML\" });\\
  } catch (err) { ctx.reply(\"Error: \" + err); }\\
});\\
\\
bot.command(\"trends\", async (ctx) => {\\
  ctx.reply(\"Scanning Upwork feeds...\");\\
  try { ctx.reply(await scanUpworkTrends(), { parse_mode: \"HTML\" }); }\\
  catch (err) { ctx.reply(\"Error: \" + err); }\\
});\\
" src/shared/telegram.ts

echo "✅ Patched: /contentpipeline and /trends added"
