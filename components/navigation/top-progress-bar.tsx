'use client';

import NextTopLoader from 'nextjs-toploader';

export function TopProgressBar() {
  return (
    <NextTopLoader
      color="#9dcf37"
      initialPosition={0.08}
      crawlSpeed={160}
      height={3}
      crawl
      easing="ease"
      speed={240}
      shadow="0 0 10px rgba(157, 207, 55, 0.45),0 0 5px rgba(157, 207, 55, 0.4)"
      showSpinner={false}
      zIndex={90}
    />
  );
}
