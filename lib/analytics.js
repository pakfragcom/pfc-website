// lib/analytics.js
// Sends events to both GA4 (already initialised in _app.js) and PostHog.
import posthog from 'posthog-js';

export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return;
  // GA4
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
  // PostHog
  posthog.capture(name, params);
}

// Named helpers for key actions — import these directly in components
export const track = {
  reviewSubmitted:  (fragrance, category)        => trackEvent('review_submitted',  { fragrance, category }),
  wishlistToggled:  (fragrance_id, fragrance, action) => trackEvent('wishlist_toggled', { fragrance_id, fragrance, action }),
  fragranceSearched:(query, result_count)         => trackEvent('fragrance_searched',{ query, result_count }),
  categoryFiltered: (category)                    => trackEvent('category_filtered', { category }),
  reviewShared:     (slug)                        => trackEvent('review_shared',     { slug }),
};
