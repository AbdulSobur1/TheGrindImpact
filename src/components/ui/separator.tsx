import * as React from 'react';
import { cn } from '@/lib/utils';

function Separator({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('shrink-0 bg-[#242424] h-[1px] w-full', className)}
      {...props}
    />
  );
}

export { Separator };
