/**
 * Responsive design utilities for mobile-first optimization
 * Ensures proper touch target sizes, font scaling, and spacing for all devices
 */

export const TOUCH_TARGET = {
  // Minimum touch target size (44px recommended by WCAG)
  MIN: 'min-h-11 min-w-11',
  // Mobile-optimized (48px for optimal mobile experience)
  MOBILE: 'h-12 w-12',
  // Standard
  DEFAULT: 'h-10 w-10',
};

export const SPACING = {
  // Mobile spacing (half on mobile, full on desktop)
  mobile: {
    xs: 'px-2 py-1',
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-5 py-4',
    xl: 'px-6 py-5',
  },
  // Desktop spacing (full)
  desktop: {
    xs: 'md:px-3 md:py-1.5',
    sm: 'md:px-4 md:py-2.5',
    md: 'md:px-6 md:py-4',
    lg: 'md:px-8 md:py-6',
    xl: 'md:px-10 md:py-8',
  },
};

export const TYPOGRAPHY = {
  // Mobile-first typography scaling
  h1: 'text-2xl md:text-4xl font-bold',
  h2: 'text-xl md:text-3xl font-bold',
  h3: 'text-lg md:text-2xl font-semibold',
  h4: 'text-base md:text-xl font-semibold',
  body: 'text-sm md:text-base',
  small: 'text-xs md:text-sm',
};

/**
 * Get combined responsive spacing classes
 */
export function getResponsiveSpacing(size: keyof typeof SPACING.mobile) {
  return `${SPACING.mobile[size]} ${SPACING.desktop[size]}`;
}

/**
 * Get responsive padding for cards on mobile
 */
export function getCardPadding() {
  return 'p-3 md:p-4';
}

/**
 * Get responsive gap for grid/flex layouts
 */
export function getResponsiveGap() {
  return 'gap-2 md:gap-4';
}

/**
 * Mobile-optimized button classes
 */
export function getButtonClasses(size: 'sm' | 'md' | 'lg' = 'md') {
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs md:px-3 md:py-2 md:text-sm',
    md: 'px-4 py-2.5 text-sm md:px-6 md:py-3 md:text-base',
    lg: 'px-5 py-3 text-base md:px-8 md:py-4 md:text-lg',
  };

  return `${TOUCH_TARGET.MIN} ${sizes[size]} rounded-lg font-medium transition-colors`;
}

/**
 * Input field optimized for mobile
 */
export function getInputClasses() {
  return 'h-11 md:h-10 px-3 md:px-4 text-base md:text-sm rounded-lg border transition-colors focus:outline-none focus:ring-2';
}
