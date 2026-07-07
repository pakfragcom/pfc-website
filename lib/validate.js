export function escHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// fields: array of [label, value, maxLength] — returns the first violation's error message, or null
export function firstTooLong(fields) {
  for (const [label, value, max] of fields) {
    if (typeof value === 'string' && value.length > max) {
      return `${label} must be ${max} characters or fewer.`;
    }
  }
  return null;
}
