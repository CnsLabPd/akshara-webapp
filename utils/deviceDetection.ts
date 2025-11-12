/**
 * Device Detection Utility
 * Determines if the user is on a desktop/laptop or mobile/tablet device
 */

/**
 * Checks if the current device is a desktop/laptop
 * @returns true if desktop/laptop, false if mobile/tablet
 */
export const isDesktopDevice = (): boolean => {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check for touch capability
  const hasTouchScreen =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0;

  // Check screen width (tablets/mobiles typically < 1024px)
  const isLargeScreen = window.innerWidth >= 1024;

  // Check user agent for mobile/tablet keywords
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const isMobileUserAgent = mobileRegex.test(navigator.userAgent);

  // Desktop criteria: Large screen AND (no touch OR not mobile user agent)
  // This allows for touch-screen laptops to still be considered desktop
  return isLargeScreen && !isMobileUserAgent;
};

/**
 * Hook to detect if device is desktop (updates on window resize)
 */
export const useIsDesktop = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  const [isDesktop, setIsDesktop] = React.useState(isDesktopDevice());

  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(isDesktopDevice());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
};

// For React hook usage
import React from 'react';
