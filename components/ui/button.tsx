import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-xs font-bold transition-[transform,box-shadow,background,color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-primary text-white shadow-[0_2px_6px_rgba(59,130,246,0.3)] hover:shadow-primary-lift hover:-translate-y-px',
        secondary:
          'bg-[#f1f5f9] text-[#475569] border border-border hover:bg-primary-50 hover:text-primary-700',
        ghost:
          'bg-transparent text-fg-muted hover:bg-primary-50 hover:text-primary-700',
        outline:
          'bg-transparent text-primary-700 border border-primary-200 hover:bg-primary-50',
        destructive:
          'bg-danger text-white hover:bg-[#991b1b]',
        warning:
          'bg-gradient-warning text-white hover:-translate-y-px hover:shadow-md',
        success:
          'bg-gradient-success text-white hover:-translate-y-px hover:shadow-md',
        link: 'text-primary-700 underline-offset-4 hover:underline bg-transparent',
      },
      size: {
        xs: 'h-6 px-2.5 text-[11px]',
        sm: 'h-7 px-3 text-[11px]',
        md: 'h-8 px-4 text-xs',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => {
    return (
      <button
        type={type}
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
