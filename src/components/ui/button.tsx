import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C8FF00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#080808] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-[#C8FF00] text-[#080808] hover:bg-[#C8FF00]/90 shadow-lg shadow-[#C8FF00]/15 hover:shadow-xl hover:shadow-[#C8FF00]/20 hover:brightness-110',
        destructive:
          'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20 hover:border-[#FF3B30]/30',
        outline:
          'border border-[#222222] bg-[#111111] text-[#F5F5F5] hover:bg-[#1C1C1C] hover:border-[#3F3F3F]',
        secondary:
          'bg-[#1C1C1C] text-[#F5F5F5] hover:bg-[#222222] border border-[#222222]',
        ghost:
          'hover:bg-[#1C1C1C] hover:text-[#F5F5F5] text-[#888888]',
        link:
          'text-[#C8FF00] underline-offset-4 hover:underline font-bold normal-case tracking-normal',
      },
      size: {
        default: 'h-11 px-6 py-3',
        sm: 'h-9 rounded-lg px-4 py-2 text-xs',
        lg: 'h-12 rounded-xl px-8 py-3 text-base',
        icon: 'h-10 w-10 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
