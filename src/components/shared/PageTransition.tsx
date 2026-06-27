'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [displayChildren, setDisplayChildren] = useState(children);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      setIsVisible(false);
      const timeout = setTimeout(() => {
        setDisplayChildren(children);
        prevPathname.current = pathname;
        // Small delay to ensure DOM has updated before fading in
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      }, 150); // Half the fade-out duration

      return () => clearTimeout(timeout);
    } else {
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(8px)',
      }}
    >
      {displayChildren}
    </div>
  );
}
