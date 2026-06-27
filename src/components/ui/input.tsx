import * as React from 'react';
import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-[#222222] bg-[#111111] px-4 py-2.5 text-sm text-[#F5F5F5] placeholder:text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#C8FF00] focus:ring-offset-1 focus:ring-offset-[#080808] focus:border-transparent disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200 ease-out',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
