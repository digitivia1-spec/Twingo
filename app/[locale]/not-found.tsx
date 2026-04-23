import { Link } from '@/lib/i18n/routing';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 text-center p-5">
      <div className="text-6xl font-extrabold text-primary-700">404</div>
      <p className="text-fg-muted">Page not found · الصفحة غير موجودة</p>
      <Link href="/">
        <Button variant="primary" size="lg">
          Go home · الرئيسية
        </Button>
      </Link>
    </div>
  );
}
