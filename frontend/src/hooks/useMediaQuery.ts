import { useEffect, useState } from 'react';

// Keep in sync with the breakpoints in index.css.
export const PHONE_QUERY = '(max-width: 768px)';
export const DRAWER_NAV_QUERY = '(max-width: 1024px)';

/** Live result of a CSS media query; updates on resize and device rotation. */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}
