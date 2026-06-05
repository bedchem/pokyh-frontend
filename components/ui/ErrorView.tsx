import { AlertTriangle, WifiOff, Lock, RefreshCw } from 'lucide-react';

// Maps any internal error to a short, user-readable German message.
// Never exposes status codes, endpoints, env var names or stack details.
function classifyError(message: string): { icon: React.ReactNode; title: string; detail: string } {
  const m = (message || '').toLowerCase();

  if (m.includes('session') || m.includes('login') || m.includes('auth') || m.includes('unauthorized') || m.includes('angemeldet')) {
    return {
      icon: <Lock size={44} color="var(--warning)" strokeWidth={1.5} />,
      title: 'Sitzung abgelaufen',
      detail: 'Bitte melde dich erneut an.',
    };
  }

  if (m.includes('network') || m.includes('fetch') || m.includes('offline') || m.includes('verbindung') || m.includes('timeout') || m.includes('econnrefused')) {
    return {
      icon: <WifiOff size={44} color="var(--app-text-tertiary)" strokeWidth={1.5} />,
      title: 'Keine Verbindung',
      detail: 'Überprüfe deine Internetverbindung und versuche es erneut.',
    };
  }

  // Everything else (incl. 5xx, WebUntis upstream errors): generic, friendly.
  return {
    icon: <AlertTriangle size={44} color="var(--warning)" strokeWidth={1.5} />,
    title: 'Daten konnten nicht geladen werden',
    detail: 'WebUntis ist gerade nicht erreichbar. Bitte versuche es später erneut.',
  };
}

export default function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { icon, title, detail } = classifyError(message);
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-8 text-center">
      {icon}
      <p className="text-base font-semibold" style={{ color: 'var(--app-text-primary)' }}>
        {title}
      </p>
      <p className="text-sm" style={{ color: 'var(--app-text-secondary)' }}>
        {detail}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-6 py-2.5 rounded-xl text-sm font-semibold press-scale flex items-center gap-2"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          <RefreshCw size={14} />
          Erneut versuchen
        </button>
      )}
    </div>
  );
}
