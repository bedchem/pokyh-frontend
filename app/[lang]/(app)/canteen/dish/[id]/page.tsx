import DishView from '@/components/mensa/DishView';
import AuthGuard from '@/components/AuthGuard';
import s from '../../canteen.module.css';

type PageProps = { params: Promise<{ lang: string; id: string }> };

// A dish of the signed-in Mensa, inside the app frame (see ../../page.tsx).
export default async function CanteenDishPage({ params }: PageProps) {
  const { id } = await params;
  return (
    <AuthGuard>
      <div className={`site ${s.frame}`}>
        <DishView id={decodeURIComponent(id)} inApp />
      </div>
    </AuthGuard>
  );
}
