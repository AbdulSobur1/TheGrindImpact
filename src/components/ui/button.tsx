import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5C00] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0D0D0D] disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]',
  {
    variants: {
      variant: {
        default:
          'bg-[#FF5C00] text-white hover:bg-[#FF5C00]/90 shadow-lg shadow-[#FF5C00]/15 hover:shadow-xl hover:shadow-[#FF5C00]/20 hover:brightness-110',
        destructive:
          'bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 hover:bg-[#FF3B30]/20 hover:border-[#FF3B30]/30',
        outline:
          'border border-[#242424] bg-[#141414] text-white hover:bg-[#1A1A1A] hover:border-[#3F3F3F]',
        secondary:
          'bg-[#1A1A1A] text-white hover:bg-[#242424] border border-[#242424]',
        ghost:
          'hover:bg-[#1A1A1A] hover:text-white text-[#999999]',
        link:
          'text-[#FF5C00] underline-offset-4 hover:underline font-bold normal-case tracking-normal',
        lime:
          'bg-[#C8FF00] text-[#0D0D0D] hover:bg-[#C8FF00]/90 shadow-lg shadow-[#C8FF00]/15 hover:shadow-xl hover:shadow-[#C8FF00]/20 font-black',
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
