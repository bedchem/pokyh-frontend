'use client';

import { apiFetch } from './api-client';

type ActivityEvent = 'page_view' | 'download' | 'login' | 'logout';

let _lastPage = '';

export function logActivity(event: ActivityEvent, page?: string, detail?: string): void {
  // Deduplicate rapid consecutive page_view events for the same path
  if (event === 'page_view' && page === _lastPage) return;
  if (event === 'page_view') _lastPage = page ?? '';

  // keepalive: the log of the page being left is sent even while the next one loads.
  apiFetch('/activity-log', {
    method: 'POST',
    body: JSON.stringify({ event, page, detail }),
    keepalive: true,
  }).catch(() => {});
}

export function logPageView(path: string): void {
  logActivity('page_view', path);
}

export function logDownload(filename: string, page?: string): void {
  logActivity('download', page, filename);
}
