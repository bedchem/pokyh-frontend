// Server-side helpers for the WebUntis MessageCenter.

import 'server-only';
import { untis } from './server/untis';
import type { Session } from './types';

export interface MessagePermissions {
  expired: boolean;
  recipientOptions: string[];
  maxFileSize: number;
  maxFileCount: number;
  showDraftsTab: boolean;
  showSentTab: boolean;
}

const DEFAULT_PERMISSIONS: Omit<MessagePermissions, 'expired'> = {
  recipientOptions: ['TEACHER'],
  maxFileSize: 7_000_000,
  maxFileCount: 5,
  showDraftsTab: true,
  showSentTab: true,
};

// The MessageCenter configuration of this account: which recipient option(s)
// it may use (e.g. ["TEACHER"]) and its attachment limits. Falls back to
// conservative defaults when the endpoint can't be read.
export async function fetchMessagePermissions(session: Session): Promise<MessagePermissions> {
  try {
    const res = await untis(session, '/api/rest/view/v1/messages/permissions', { timeoutMs: 10000 });
    if (res.expired) return { expired: true, ...DEFAULT_PERMISSIONS };
    if (!res.ok || !res.json || typeof res.json !== 'object') return { expired: false, ...DEFAULT_PERMISSIONS };
    const j = res.json as Partial<MessagePermissions>;
    const options = Array.isArray(j.recipientOptions) && j.recipientOptions.length
      ? j.recipientOptions.map(String)
      : DEFAULT_PERMISSIONS.recipientOptions;
    return {
      expired: false,
      recipientOptions: options,
      maxFileSize: Number(j.maxFileSize) || DEFAULT_PERMISSIONS.maxFileSize,
      maxFileCount: Number(j.maxFileCount) || DEFAULT_PERMISSIONS.maxFileCount,
      showDraftsTab: j.showDraftsTab !== false,
      showSentTab: j.showSentTab !== false,
    };
  } catch {
    return { expired: false, ...DEFAULT_PERMISSIONS };
  }
}

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * The official composer is a rich-text editor and stores HTML. Plain text from
 * Pokyh is escaped and laid out as paragraphs (blank line) and line breaks.
 */
export function plainTextToHtml(text: string): string {
  const escaped = text.replace(/\r\n?/g, '\n').replace(/[&<>"']/g, (c) => ESCAPES[c]);
  return escaped
    .split(/\n{2,}/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${para.replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** HTML message body → plain text for editing a draft in a textarea. */
export function htmlToText(html: string): string {
  return html
    .replace(/<\s*br\s*\/?\s*>/gi, '\n')
    .replace(/<\/\s*p\s*>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
