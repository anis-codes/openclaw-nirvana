import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../../logger';

const feedbackFile = path.join(process.cwd(), 'skills', 'proposal-writing', 'FEEDBACK.md');

export function logProposalFeedback(
  action: 'approved' | 'rejected',
  proposal: string,
  reason?: string
): void {
  const timestamp = new Date().toISOString().split('T')[0];
  const snippet = proposal.slice(0, 300).replace(/\n/g, ' ');

  let entry = `\n## ${action.toUpperCase()} — ${timestamp}\n`;
  entry += `**Snippet:** ${snippet}...\n`;
  if (reason) entry += `**Reason:** ${reason}\n`;
  entry += `---\n`;

  try {
    if (!fs.existsSync(feedbackFile)) {
      fs.writeFileSync(feedbackFile, `# Proposal Feedback Log\nUsed by the proposal-writing skill to improve future proposals.\n\n`);
    }
    fs.appendFileSync(feedbackFile, entry);
    logger.info(`Proposal feedback logged: ${action}`);
  } catch (err) {
    logger.error(`Failed to log proposal feedback: ${err}`);
  }
}

export function getFeedbackSummary(): string {
  try {
    if (!fs.existsSync(feedbackFile)) return '';
    const raw = fs.readFileSync(feedbackFile, 'utf-8');
    const approved = (raw.match(/## APPROVED/g) || []).length;
    const rejected = (raw.match(/## REJECTED/g) || []).length;
    const total = approved + rejected;
    if (total === 0) return '';

    const rejections = raw.match(/## REJECTED[\s\S]*?---/g) || [];
    const recentRejects = rejections.slice(-3).join('\n');

    return `\n\n<proposal_feedback>\n` +
      `Win rate: ${approved}/${total} (${total > 0 ? ((approved/total)*100).toFixed(0) : 0}%)\n` +
      `${recentRejects ? `\nRecent rejections to learn from:\n${recentRejects}` : ''}\n` +
      `</proposal_feedback>`;
  } catch {
    return '';
  }
}
