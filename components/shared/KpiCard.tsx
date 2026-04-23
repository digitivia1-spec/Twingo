import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  elementId: string;
  label: string;
  value: string | number;
  sub?: string;
  tone?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  href?: string;
  onClick?: () => void;
}

const TOP_BORDER: Record<NonNullable<KpiCardProps['tone']>, string> = {
  primary: 'border-t-primary-700',
  success: 'border-t-success',
  warning: 'border-t-warning',
  danger: 'border-t-danger',
  info: 'border-t-info',
  neutral: 'border-t-fg-muted',
};

const VALUE_COLOR: Record<NonNullable<KpiCardProps['tone']>, string> = {
  primary: 'text-primary-700',
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  info: 'text-info',
  neutral: 'text-fg',
};

export function KpiCard({
  elementId,
  label,
  value,
  sub,
  tone = 'primary',
  href,
  onClick,
}: KpiCardProps) {
  const content = (
    <div
      className={cn(
        'rounded-[var(--radius)] border border-border border-t-[3px] bg-surface p-5 shadow-sm transition-shadow hover:shadow-md',
        TOP_BORDER[tone],
      )}
    >
      <div className="text-[11px] font-semibold tracking-wide text-fg-subtle">
        {label}
      </div>
      <div className={cn('mt-1 text-[22px] font-extrabold', VALUE_COLOR[tone])}>
        {value}
      </div>
      {sub && <div className="mt-1 text-[11px] text-fg-muted">{sub}</div>}
    </div>
  );

  return (
    <FeedbackPin elementId={elementId} className="block">
      {href ? (
        <a href={href} className="block">
          {content}
        </a>
      ) : onClick ? (
        <button type="button" onClick={onClick} className="w-full text-start">
          {content}
        </button>
      ) : (
        content
      )}
    </FeedbackPin>
  );
}
