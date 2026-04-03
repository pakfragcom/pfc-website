// lib/analytics.js
// Thin wrapper around window.gtag so tool pages don't call it directly.
// GA4 tracking ID is already initialised in pages/_app.js

/**
 * Track a custom GA4 event.
 * @param {string} name   - GA4 event name (snake_case)
 * @param {object} params - GA4 event parameters
 */
export function trackEvent(name, params = {}) {
  if (typeof window === 'undefined') return
  if (typeof window.gtag !== 'function') return
  window.gtag('event', name, params)
}
