import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C8FF00] focus:ring-offset-2 focus:ring-offset-[#080808]',
  {
    variants: {
      variant: {
        default:
          'border-[#222222] bg-[#1C1C1C] text-[#888888]',
        secondary:
          'border-[#C8FF00]/20 bg-[#C8FF00]/8 text-[#C8FF00]',
        destructive:
          'border-[#FF3B30]/20 bg-[#FF3B30]/8 text-[#FF3B30]',
        outline:
          'border-[#222222] text-[#F5F5F5]',
        success:
          'border-[#30D158]/20 bg-[#30D158]/8 text-[#30D158]',
        warning:
          'border-[#FF9500]/20 bg-[#FF9500]/8 text-[#FF9500]',
        gold:
          'border-[#FF9500]/40 bg-[#FF9500]/10 text-[#FF9500] shadow-[0_0_12px_rgba(255,149,0,0.1)]',
        lime:
          'border-[#C8FF00]/30 bg-[#C8FF00]/10 text-[#C8FF00]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
