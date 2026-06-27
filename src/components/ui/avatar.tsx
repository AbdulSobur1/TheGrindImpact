'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm',
  xl: 'h-20 w-20 text-lg',
};

function Avatar({ className, src, alt = '', fallback, size = 'md', ...props }: AvatarProps) {
  const [error, setError] = React.useState(false);
  const hasImage = !!src && !error;

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full ring-2 ring-[#242424] ring-offset-2 ring-offset-[#0D0D0D]',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {hasImage ? (
        <img
          src={src!}
          alt={alt}
          className="aspect-square h-full w-full object-cover"
          onError={() => setError(true)}
          loading="lazy"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[#1A1A1A] text-[#999999] font-bold">
          {fallback || alt?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
    </div>
  );
}

export { Avatar };
