import { google } from 'googleapis';
import { notify } from '../../shared/bot';
import { logger } from '../../logger';
import { config } from '../../config';

const PRIORITY_SENDERS = [
  { email: 'shawn', client: 'MTM' },
  { email: 'participate', client: 'PE' },
  { email: 'mlt', client: 'MLT' },
];

const IGNORE_PATTERNS = [
  'noreply', 'newsletter', 'marketing', 'unsubscribe',
  'notifications@', 'no-reply', 'donotreply',
];

function getAuth() {
  return new google.auth.OAuth2(
    config.GMAIL_CLIENT_ID,
    config.GMAIL_CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'
  );
}

export async function scanEmails(): Promise<void> {
  try {
    const auth = getAuth();
    auth.setCredentials({ refresh_token: config.GMAIL_REFRESH_TOKEN });

    const gmail = google.gmail({ version: 'v1', auth });

    // Get emails from last 30 minutes
    const cutoff = Math.floor((Date.now() - 30 * 60 * 1000) / 1000);
    const res = await gmail.users.messages.list({
      userId: 'me',
      q: `after:${cutoff} is:unread category:primary`,
      maxResults: 10,
    });

    const messages = res.data.messages || [];
    if (!messages.length) return;

    const alerts: string[] = [];

    for (const msg of messages) {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'metadata',
        metadataHeaders: ['From', 'Subject'],
      });

      const headers = detail.data.payload?.headers || [];
      const from = headers.find(h => h.name === 'From')?.value || '';
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const fromLower = from.toLowerCase();

      // Skip junk
      if (IGNORE_PATTERNS.some(p => fromLower.includes(p))) continue;

      // Check priority
      const priority = PRIORITY_SENDERS.find(s => fromLower.includes(s.email));

      if (priority) {
        alerts.push(`🔴 <b>${priority.client}</b>: ${subject}\n  From: ${from}`);
      } else {
        alerts.push(`📧 ${subject}\n  From: ${from}`);
      }
    }

    if (alerts.length > 0) {
      let msg = `<b>📬 EMAIL ALERT</b> (${alerts.length} new)\n\n`;
      alerts.forEach(a => { msg += `${a}\n\n`; });
      await notify(msg);
    }

    logger.info(`Email scan: ${alerts.length} alerts from ${messages.length} messages`);
  } catch (err) {
    logger.error('Email scan failed', { err });
  }
}
