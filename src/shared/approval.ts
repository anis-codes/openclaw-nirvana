import { bot, notify } from './bot';
import { logger } from '../logger';
import { logAction } from './log-action';
import { logProposalFeedback } from '../agents/upwork-bd/proposal-feedback';

interface ApprovalRequest {
  agent: string;
  actionType: string;
  summary: string;
  fullContent: string;
  onApprove: () => Promise<void>;
  onReject: () => Promise<void>;
}

const pendingApprovals = new Map<string, { req: ApprovalRequest; sentAt: number }>();

export async function requestApproval(req: ApprovalRequest): Promise<void> {
  const id = Date.now().toString(36);
  pendingApprovals.set(id, { req, sentAt: Date.now() });
  await notify(
    `<b>\u{1F7E1} APPROVAL NEEDED</b>\n` +
    `Agent: ${req.agent}\n` +
    `Action: ${req.actionType}\n\n` +
    `${req.summary}\n\n` +
    `Reply: /approve_${id} or /reject_${id}`
  );
  await logAction({ agent: req.agent, action: 'approval_requested',
    metadata: { approvalId: id, actionType: req.actionType } });
}

bot.hears(/^\/approve_(\w+)$/, async (ctx) => {
  const id = ctx.match![1];
  const pending = pendingApprovals.get(id);
  if (!pending) return ctx.reply('Approval not found or expired.');
  try {
    await pending.req.onApprove();
    const minutes = (Date.now() - pending.sentAt) / 60000;
    if (pending.req.actionType === 'submit_proposal') {
      logProposalFeedback('approved', pending.req.fullContent);
    }
    pendingApprovals.delete(id);
    ctx.reply(`\u2705 Approved: ${pending.req.actionType}`);
    await logAction({ agent: pending.req.agent, action: 'approved',
      metadata: { approvalId: id, minutesSpent: Math.round(minutes * 10) / 10 } });
  } catch (err) {
    ctx.reply(`\u274C Error executing: ${err}`);
  }
});

bot.hears(/^\/reject_(\w+)$/, async (ctx) => {
  const id = ctx.match![1];
  const pending = pendingApprovals.get(id);
  if (!pending) return ctx.reply('Approval not found or expired.');
  const minutes = (Date.now() - pending.sentAt) / 60000;
  await pending.req.onReject();
  if (pending.req.actionType === 'submit_proposal') {
    logProposalFeedback('rejected', pending.req.fullContent);
    ctx.reply('Tip: Use /rejectreason <why> to help improve future proposals.');
  }
  pendingApprovals.delete(id);
  ctx.reply(`\u{1F6AB} Rejected: ${pending.req.actionType}`);
  await logAction({ agent: pending.req.agent, action: 'rejected',
    metadata: { approvalId: id, minutesSpent: Math.round(minutes * 10) / 10 } });
});
