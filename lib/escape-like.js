// Escapes Postgres LIKE/ILIKE wildcard characters so user input used as an
// .ilike() pattern is matched literally instead of as a wildcard expression.
export function escapeLikePattern(str) {
  return str.replace(/[\\%_]/g, (c) => `\\${c}`);
}
