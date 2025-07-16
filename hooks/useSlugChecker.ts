import { useState, useEffect } from 'react';

interface UseSlugCheckerOptions {
  slug: string;
  excludeSlug?: string; // For edit mode - don't check against current slug
  minLength?: number;
  debounceMs?: number;
}

interface UseSlugCheckerReturn {
  slugAvailable: boolean | null;
  checkingSlug: boolean;
  isValidFormat: boolean;
  shouldShowStatus: boolean;
}

export function useSlugChecker({
  slug,
  excludeSlug,
  minLength = 2,
  debounceMs = 500,
}: UseSlugCheckerOptions): UseSlugCheckerReturn {
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const isValidFormat = /^[-a-zA-Z0-9_]+$/.test(slug);
  const shouldCheck = Boolean(slug) && 
    slug.length >= minLength && 
    slug !== excludeSlug && 
    isValidFormat;
  const shouldShowStatus = Boolean(slug) && slug.length >= minLength;

  useEffect(() => {
    // Reset states if we shouldn't check
    if (!shouldCheck) {
      setSlugAvailable(null);
      setCheckingSlug(false);
      return;
    }

    setCheckingSlug(true);
    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/check-slug?slug=${encodeURIComponent(slug)}`);
        const data = await response.json();
        setSlugAvailable(data.available);
      } catch (err) {
        console.error("Error checking slug:", err);
        setSlugAvailable(null);
      }
      setCheckingSlug(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [slug, excludeSlug, shouldCheck, debounceMs]);

  return {
    slugAvailable,
    checkingSlug,
    isValidFormat,
    shouldShowStatus,
  };
} 