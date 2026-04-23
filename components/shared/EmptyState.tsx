import { PackageSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { ComponentType } from 'react';

export function EmptyState({
  icon: Icon = PackageSearch,
  title,
  subtitle,
  cta,
}: {
  icon?: ComponentType<{ className?: string }>;
  title?: string;
  subtitle?: string;
  cta?: React.ReactNode;
}) {
  const t = useTranslations('common');
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <Icon className="h-12 w-12 text-fg-subtle" aria-hidden />
      <div>
        <div className="text-base font-bold text-fg">
          {title ?? t('empty')}
        </div>
        <div className="mt-1 text-xs text-fg-muted">
          {subtitle ?? t('emptySub')}
        </div>
      </div>
      {cta}
    </div>
  );
}
