// lib/s3-utils.ts

/**
 * Sanitizes a username/name string to make it safe for S3 object keys
 * - Converts to lowercase
 * - Replaces spaces with underscores
 * - Removes special characters except underscores and hyphens
 * - Limits length to 50 characters
 *
 * @param name - The name to sanitize
 * @returns A sanitized string safe for use in S3 keys
 */
export function sanitizeNameForS3(name: string): string {
  if (!name) {
    return 'unknown';
  }

  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-z0-9_-]/g, '') // Remove special characters
    .substring(0, 50) // Limit length
    || 'unknown'; // Fallback if result is empty
}
