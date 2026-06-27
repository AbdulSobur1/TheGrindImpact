import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#FF5C00] focus:ring-offset-2 focus:ring-offset-[#0D0D0D]',
  {
    variants: {
      variant: {
        default:
          'border-[#242424] bg-[#1A1A1A] text-[#999999]',
        secondary:
          'border-[#FF5C00]/20 bg-[#FF5C00]/8 text-[#FF5C00]',
        destructive:
          'border-[#FF3B30]/20 bg-[#FF3B30]/8 text-[#FF3B30]',
        outline:
          'border-[#242424] text-white',
        success:
          'border-[#34C759]/20 bg-[#34C759]/8 text-[#34C759]',
        warning:
          'border-[#FF9F0A]/20 bg-[#FF9F0A]/8 text-[#FF9F0A]',
        gold:
          'border-[#FF9F0A]/40 bg-[#FF9F0A]/10 text-[#FF9F0A] shadow-[0_0_12px_rgba(255,159,10,0.1)]',
        lime:
          'border-[#C8FF00]/30 bg-[#C8FF00]/10 text-[#C8FF00] shadow-[0_0_12px_rgba(200,255,0,0.08)]',
        orange:
          'border-[#FF5C00]/30 bg-[#FF5C00]/10 text-[#FF5C00] shadow-[0_0_12px_rgba(255,92,0,0.08)]',
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
