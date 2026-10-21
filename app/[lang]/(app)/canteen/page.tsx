import MensaClient from '@/app/[lang]/(site)/mensa/MensaClient';
import AuthGuard from '@/components/AuthGuard';
import s from './canteen.module.css';

// The Mensa for signed-in accounts: the public Mensa page as it is, inside the
// app frame. Signed in, MensaClient shows the comments and lets you rate and
// comment; guests are sent to the public /mensa page instead (proxy.ts).
export default function CanteenPage() {
  return (
    <AuthGuard guests="mensa">
      <div className={`site ${s.frame}`}>
        <MensaClient inApp />
      </div>
    </AuthGuard>
  );
}
