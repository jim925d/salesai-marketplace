// Input sanitization for XSS prevention
// Uses DOMPurify to strip HTML tags from user input before storage or display

import DOMPurify from 'dompurify'

/**
 * Strip ALL HTML from user input — use on every text input before
 * sending to Supabase, Stripe metadata, or audit logs.
 */
export function sanitize(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

/**
 * Allow a safe subset of HTML tags — use only for rich-text fields
 * like long descriptions that intentionally support basic formatting.
 */
export function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'br', 'p', 'ul', 'li'],
    ALLOWED_ATTR: [],
  })
}
