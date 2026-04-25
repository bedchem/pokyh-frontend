import { AlertTriangle, WifiOff, Lock, RefreshCw } from 'lucide-react';

function classifyError(message: string): { icon: React.ReactNode; title: string; detail: string } {
  const m = message.toLowerCase();
  if (m.includes('session') || m.includes('login') || m.includes('auth') || m.includes('unauthorized') || m === 'session_expired') {
    return {
      icon: <Lock size={44} color="var(--warning)" strokeWidth={1.5} />,
      title: 'Sitzung abgelaufen',
      detail: 'Bitte melde dich erneut an.',
    };
  }
  if (m.includes('network') || m.includes('fetch') || m.includes('failed') || m.includes('offline') || m.includes('verbindung') || m.includes('timeout') || m.includes('econnrefused')) {
    return {
      icon: <WifiOff size={44} color="var(--app-text-tertiary)" strokeWidth={1.5} />,
      title: 'Keine Verbindung',
      detail: 'Überprüfe deine Internetverbindung und versuche es erneut.',
    };
  }
  return {
    icon: <AlertTriangle size={44} color="var(--warning)" strokeWidth={1.5} />,
    title: 'Fehler aufgetreten',
    detail: message,
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
      {process.env.NODE_ENV === 'development' && message !== detail && (
        <p className="text-xs font-mono px-3 py-2 rounded-lg mt-1" style={{ background: 'var(--app-card)', color: 'var(--app-text-tertiary)', wordBreak: 'break-all' }}>
          {message}
        </p>
      )}
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
