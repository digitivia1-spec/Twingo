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
      <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-fg sm:text-xl">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-xs text-fg-muted">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 sm:flex-nowrap">
            {actions}
          </div>
        )}
      </div>
    </FeedbackPin>
  );
}
