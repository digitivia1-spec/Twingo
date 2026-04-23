import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg placeholder:text-fg-subtle',
          'focus-visible:outline-none focus-visible:border-primary-500 focus-visible:ring-0',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'aria-[invalid=true]:border-danger aria-[invalid=true]:text-danger',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
