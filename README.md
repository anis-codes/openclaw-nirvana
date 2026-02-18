# OpenClaw Nirvana

AI-powered command center for Nirvana Solutions LLC. Six autonomous agents managed through Telegram, with automatic cost tracking, approval flows, and billing.

Built in one session. Runs on PM2. Every Claude API call logged with token count and USD cost.

## Architecture

```
Telegram Bot (@nirvana_cmd_bot)
    │
    ├── UPWORK-BD      → Proposal generation + job scanning
    ├── SFDC-OPS       → SOQL generation, debugging, SF architecture
    ├── HSPOT-OPS      → Workflow design, debugging, HubSpot ops
    ├── NIRVANA-PA     → Drafts, prioritization, billing
    ├── CONTENT-ENGINE → LinkedIn posts, blog posts, content ideas
    ├── ALPHA-FIN      → Market analysis, paper trading with P&L
    └── SYSTEM-AUDITOR → Weekly reports, daily budget alerts
```

## Stack

- **Runtime:** Node.js + Express + TypeScript
- **AI:** Claude Sonnet 4.5 via Anthropic SDK
- **Database:** Supabase (PostgreSQL)
- **Bot:** grammY (Telegram)
- **Scheduling:** node-cron
- **Logging:** Winston
- **Validation:** Zod
- **Process Manager:** PM2

## Commands

### System
| Command | Description |
|---------|-------------|
| `/start` | Confirm bot is active |
| `/health` | Uptime + memory |
| `/report` | Weekly cost/revenue/ROI report |
| `/help` | List all commands |

### Upwork (UPWORK-BD)
| Command | Description |
|---------|-------------|
| `/proposal <job text>` | Generate proposal with approval flow |
| `/scan` | Scan RSS job feeds |

### Salesforce (SFDC-OPS)
| Command | Description |
|---------|-------------|
| `/soql <request>` | Natural language → SOQL query |
| `/sfdebug <error>` | Debug Salesforce issues |
| `/sf <question>` | General Salesforce help |

### HubSpot (HSPOT-OPS)
| Command | Description |
|---------|-------------|
| `/hsflow <request>` | Design HubSpot workflow |
| `/hsdebug <error>` | Debug HubSpot issues |
| `/hs <question>` | General HubSpot help |

### Assistant (NIRVANA-PA)
| Command | Description |
|---------|-------------|
| `/draft <request>` | Draft emails/messages |
| `/prioritize <tasks>` | Prioritize work across clients |
| `/pa <anything>` | General assistant |

### Content (CONTENT-ENGINE)
| Command | Description |
|---------|-------------|
| `/linkedin <topic>` | Generate LinkedIn post |
| `/blog <topic>` | Generate blog post |
| `/ideas <context>` | Generate content ideas |

### Trading (ALPHA-FIN)
| Command | Description |
|---------|-------------|
| `/analyze <query>` | Market analysis |
| `/trade <ticker>` | Generate trade idea |
| `/opentrade` | Open paper trade |
| `/closetrade` | Close paper trade with P&L |
| `/portfolio` | View positions + win rate |

### Billing
| Command | Description |
|---------|-------------|
| `/logtime CLIENT HOURS RATE "desc"` | Log billable hours |
| `/unbilled` | View unbilled hours by client |
| `/invoiced CLIENT` | Mark client hours as invoiced |

## Database (Supabase)

| Table | Purpose |
|-------|---------|
| `agent_logs` | Every agent action with tokens and duration |
| `agent_cost_log` | USD cost per Claude call by agent |
| `revenue_events` | Revenue tracking by agent |
| `human_time_log` | Human time spent on approvals |
| `proposal_outcomes` | Proposal win/loss tracking |
| `paper_trades` | Paper trading positions and P&L |
| `billable_hours` | Client billing with invoice tracking |

## Setup

```bash
git clone https://github.com/anis-codes/openclaw-nirvana.git
cd openclaw-nirvana
npm install
```

Create `.env`:
```
ANTHROPIC_API_KEY=your-key
SUPABASE_URL=your-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_USER_ID=your-id
NODE_ENV=development
PORT=3000
```

Run Supabase table creation SQL (see `/docs` or BUILD_LOG.md).

```bash
npm run dev        # Development
npm run build      # Compile TypeScript
pm2 start dist/index.js --name openclaw  # Production
```

## Cost Tracking

Every Claude API call is automatically logged with:
- Input/output token counts
- Model used
- Estimated USD cost (Sonnet 4.5: $3/$15 per M tokens)
- Agent name and task type

Use `/report` for weekly cost breakdown by agent.

## Security

- Telegram bot only responds to authorized user ID
- All API keys in `.env` (gitignored)
- Supabase Row Level Security available
- Approval flow required for external actions (proposals)

## License

Private. Nirvana Solutions LLC.
