// UUID Utility functions for E-Wheels BMS
import { v4 as uuidv4 } from 'uuid';

/**
 * Validate if a string is a valid UUID v4 format
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Generate a new UUID v4
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Convert simple ID to UUID for testing purposes
 * This creates consistent UUIDs based on the input number
 */
export function testIdToUUID(id: string | number): string {
  const numId = typeof id === 'string' ? parseInt(id) : id;
  // Create a consistent UUID based on the number
  // Using a deterministic approach for testing
  const baseUUID = '00000000-0000-4000-8000-000000000000';
  const paddedId = numId.toString().padStart(3, '0');
  return baseUUID.slice(0, -3) + paddedId;
}

/**
 * Sample UUIDs for testing - these would match your database
 * Replace these with actual UUIDs from your database
 */
export const SAMPLE_BATTERY_UUIDS = {
  '1': 'a1b2c3d4-e5f6-4789-8abc-123456789001',
  '2': 'a1b2c3d4-e5f6-4789-8abc-123456789002', 
  '3': 'a1b2c3d4-e5f6-4789-8abc-123456789003',
  // Add more as needed
} as const;

/**
 * Get a sample UUID for testing
 */
export function getSampleBatteryUUID(index: string | number): string {
  const key = index.toString() as keyof typeof SAMPLE_BATTERY_UUIDS;
  return SAMPLE_BATTERY_UUIDS[key] || testIdToUUID(index);
}

/**
 * Extract simple ID from UUID for display purposes
 * This is useful if you want to show shorter IDs in the UI
 */
export function extractSimpleId(uuid: string): string {
  if (!isValidUUID(uuid)) {
    return uuid; // Return as-is if not a UUID
  }
  // Extract the last part of the UUID for display
  return uuid.split('-').pop()?.slice(-3) || uuid;
}

/**
 * Format UUID for display in a more readable way
 */
export function formatUUIDForDisplay(uuid: string, length: number = 8): string {
  if (!isValidUUID(uuid)) {
    return uuid;
  }
  return uuid.slice(0, length) + '...';
}
