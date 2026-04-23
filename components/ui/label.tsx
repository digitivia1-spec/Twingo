import * as React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }
>(({ className, children, required, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      'text-[11px] font-semibold text-fg-muted tracking-wide',
      className,
    )}
    {...props}
  >
    {children}
    {required && <span className="ms-1 text-danger">*</span>}
  </label>
));
Label.displayName = 'Label';
