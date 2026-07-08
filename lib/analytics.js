// lib/analytics.js
// Sends events to GA4 (initialised via public/gtag-init.js, loaded in _app.js).
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return;
  if (typeof window.gtag === 'function') window.gtag('event', name, params);
}

// Named helpers for key actions — import these directly in components
export const track = {
  reviewSubmitted:  (fragrance, category)        => trackEvent('review_submitted',  { fragrance, category }),
  wishlistToggled:  (fragrance_id, fragrance, action) => trackEvent('wishlist_toggled', { fragrance_id, fragrance, action }),
  fragranceSearched:(query, result_count)         => trackEvent('fragrance_searched',{ query, result_count }),
  categoryFiltered: (category)                    => trackEvent('category_filtered', { category }),
  reviewShared:     (slug)                        => trackEvent('review_shared',     { slug }),
};
