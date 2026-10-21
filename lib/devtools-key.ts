// The keys that open the browser's developer tools: F12, Ctrl/Cmd+Shift+I/J/C
// and Cmd+Option+I/J/C. Shared by the console greeting (lib/console-secret.ts)
// and its loader (components/ConsoleSecret.tsx), which must not load the
// greeting itself to recognise them.
export function isDevtoolsShortcut(e: KeyboardEvent): boolean {
  // Autofill sends keydown events without a key.
  if (typeof e.key !== 'string') return false;
  const key = e.key.toLowerCase();
  return e.key === 'F12'
    || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(key))
    || (e.metaKey && e.altKey && ['i', 'j', 'c'].includes(key));
}
