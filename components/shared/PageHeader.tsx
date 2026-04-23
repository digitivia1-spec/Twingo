import { FeedbackPin } from '@/components/feedback/FeedbackPin';

interface PageHeaderProps {
  elementId: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function PageHeader({
  elementId,
  title,
  subtitle,
  actions,
}: PageHeaderProps) {
  return (
    <FeedbackPin elementId={`${elementId}.header`}>
      <div className="flex items-start justify-between gap-4 pb-4">
        <div>
          <h1 className="text-xl font-bold text-fg">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-xs text-fg-muted">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </FeedbackPin>
  );
}
