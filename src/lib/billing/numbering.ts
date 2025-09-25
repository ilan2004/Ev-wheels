/**
 * Numbering system for quotes and invoices
 * Supports formats like Q-2024-0001, INV-2024-0001
 */

export interface NumberingConfig {
  prefix: string;
  includeYear: boolean;
  digitCount: number;
  separator: string;
  resetYearly: boolean;
}

export const DEFAULT_QUOTE_CONFIG: NumberingConfig = {
  prefix: 'Q',
  includeYear: true,
  digitCount: 4,
  separator: '-',
  resetYearly: true,
};

export const DEFAULT_INVOICE_CONFIG: NumberingConfig = {
  prefix: 'INV',
  includeYear: true,
  digitCount: 4,
  separator: '-',
  resetYearly: true,
};

/**
 * In-memory counter storage (will be replaced by database storage)
 * This is temporary for MVP - in production should use DB sequences
 */
class InMemoryNumberingStore {
  private counters: Map<string, number> = new Map();
  
  getNextNumber(key: string): number {
    const current = this.counters.get(key) || 0;
    const next = current + 1;
    this.counters.set(key, next);
    return next;
  }
  
  getCurrentNumber(key: string): number {
    return this.counters.get(key) || 0;
  }
  
  setNumber(key: string, value: number): void {
    this.counters.set(key, value);
  }
  
  reset(): void {
    this.counters.clear();
  }
  
  // Get all keys for debugging
  getAllKeys(): string[] {
    return Array.from(this.counters.keys());
  }
}

// Global instance for in-memory storage
const inMemoryStore = new InMemoryNumberingStore();

/**
 * Generate a counter key for the numbering system
 */
function generateCounterKey(config: NumberingConfig, year?: number): string {
  if (config.includeYear && config.resetYearly) {
    const currentYear = year || new Date().getFullYear();
    return `${config.prefix.toLowerCase()}_${currentYear}`;
  }
  return `${config.prefix.toLowerCase()}_global`;
}

/**
 * Format number with leading zeros
 */
function padNumber(num: number, digitCount: number): string {
  return num.toString().padStart(digitCount, '0');
}

/**
 * Parse existing number to extract sequence
 */
export function parseExistingNumber(
  numberString: string, 
  config: NumberingConfig
): { year?: number; sequence: number } | null {
  const parts = numberString.split(config.separator);
  
  if (config.includeYear) {
    // Expected format: PREFIX-YYYY-NNNN
    if (parts.length !== 3 || parts[0] !== config.prefix) {
      return null;
    }
    
    const year = parseInt(parts[1]);
    const sequence = parseInt(parts[2]);
    
    if (isNaN(year) || isNaN(sequence)) {
      return null;
    }
    
    return { year, sequence };
  } else {
    // Expected format: PREFIX-NNNN
    if (parts.length !== 2 || parts[0] !== config.prefix) {
      return null;
    }
    
    const sequence = parseInt(parts[1]);
    if (isNaN(sequence)) {
      return null;
    }
    
    return { sequence };
  }
}

/**
 * Generate next quote number
 */
export function generateQuoteNumber(
  config: NumberingConfig = DEFAULT_QUOTE_CONFIG,
  existingNumbers: string[] = [],
  specifiedYear?: number
): string {
  return generateNumber(config, existingNumbers, specifiedYear);
}

/**
 * Generate next invoice number
 */
export function generateInvoiceNumber(
  config: NumberingConfig = DEFAULT_INVOICE_CONFIG,
  existingNumbers: string[] = [],
  specifiedYear?: number
): string {
  return generateNumber(config, existingNumbers, specifiedYear);
}

/**
 * Core number generation logic
 */
function generateNumber(
  config: NumberingConfig,
  existingNumbers: string[] = [],
  specifiedYear?: number
): string {
  const currentYear = specifiedYear || new Date().getFullYear();
  const counterKey = generateCounterKey(config, currentYear);
  
  // Initialize counter based on existing numbers
  if (existingNumbers.length > 0) {
    let maxSequence = 0;
    
    for (const existing of existingNumbers) {
      const parsed = parseExistingNumber(existing, config);
      if (parsed) {
        // If config includes year and resets yearly, only count numbers from same year
        if (config.includeYear && config.resetYearly) {
          if (parsed.year === currentYear) {
            maxSequence = Math.max(maxSequence, parsed.sequence);
          }
        } else {
          maxSequence = Math.max(maxSequence, parsed.sequence);
        }
      }
    }
    
    // Set counter to max found sequence
    if (maxSequence > inMemoryStore.getCurrentNumber(counterKey)) {
      inMemoryStore.setNumber(counterKey, maxSequence);
    }
  }
  
  // Get next number
  const nextSequence = inMemoryStore.getNextNumber(counterKey);
  
  // Format the number
  return formatNumber(config, nextSequence, currentYear);
}

/**
 * Format number according to config
 */
function formatNumber(config: NumberingConfig, sequence: number, year: number): string {
  const paddedSequence = padNumber(sequence, config.digitCount);
  
  if (config.includeYear) {
    return `${config.prefix}${config.separator}${year}${config.separator}${paddedSequence}`;
  } else {
    return `${config.prefix}${config.separator}${paddedSequence}`;
  }
}

/**
 * Validate number format
 */
export function validateNumberFormat(
  numberString: string, 
  config: NumberingConfig
): boolean {
  return parseExistingNumber(numberString, config) !== null;
}

/**
 * Reset counters (useful for testing or year-end reset)
 */
export function resetCounters(): void {
  inMemoryStore.reset();
}

/**
 * Get current counter value for debugging
 */
export function getCurrentCounter(
  config: NumberingConfig, 
  year?: number
): number {
  const counterKey = generateCounterKey(config, year);
  return inMemoryStore.getCurrentNumber(counterKey);
}

/**
 * Preview next number without incrementing counter
 */
export function previewNextNumber(
  config: NumberingConfig,
  existingNumbers: string[] = [],
  specifiedYear?: number
): string {
  const currentYear = specifiedYear || new Date().getFullYear();
  const counterKey = generateCounterKey(config, currentYear);
  
  // Calculate what the next sequence would be
  let maxSequence = inMemoryStore.getCurrentNumber(counterKey);
  
  if (existingNumbers.length > 0) {
    for (const existing of existingNumbers) {
      const parsed = parseExistingNumber(existing, config);
      if (parsed) {
        if (config.includeYear && config.resetYearly) {
          if (parsed.year === currentYear) {
            maxSequence = Math.max(maxSequence, parsed.sequence);
          }
        } else {
          maxSequence = Math.max(maxSequence, parsed.sequence);
        }
      }
    }
  }
  
  const nextSequence = maxSequence + 1;
  return formatNumber(config, nextSequence, currentYear);
}

/**
 * Bulk generate numbers (useful for batch operations)
 */
export function generateBulkNumbers(
  config: NumberingConfig,
  count: number,
  existingNumbers: string[] = [],
  specifiedYear?: number
): string[] {
  const numbers: string[] = [];
  
  for (let i = 0; i < count; i++) {
    const number = generateNumber(config, [...existingNumbers, ...numbers], specifiedYear);
    numbers.push(number);
  }
  
  return numbers;
}

/**
 * Check if a number already exists in the list
 */
export function numberExists(numberString: string, existingNumbers: string[]): boolean {
  return existingNumbers.includes(numberString);
}

/**
 * Generate unique number with collision detection
 */
export function generateUniqueNumber(
  config: NumberingConfig,
  existingNumbers: string[] = [],
  maxRetries: number = 100,
  specifiedYear?: number
): string {
  for (let i = 0; i < maxRetries; i++) {
    const number = generateNumber(config, existingNumbers, specifiedYear);
    
    if (!numberExists(number, existingNumbers)) {
      return number;
    }
    
    // If collision detected, add to existing numbers to avoid it in next iteration
    existingNumbers.push(number);
  }
  
  throw new Error(`Unable to generate unique number after ${maxRetries} retries`);
}

/**
 * Extract year from existing number (if format includes year)
 */
export function extractYearFromNumber(
  numberString: string,
  config: NumberingConfig
): number | null {
  const parsed = parseExistingNumber(numberString, config);
  return parsed?.year || null;
}

/**
 * Get numbers for specific year
 */
export function filterNumbersByYear(
  numbers: string[],
  year: number,
  config: NumberingConfig
): string[] {
  return numbers.filter(number => {
    const extractedYear = extractYearFromNumber(number, config);
    return extractedYear === year;
  });
}

/**
 * Database interface for production use
 * This interface should be implemented when moving to actual database storage
 */
export interface NumberingRepository {
  getNextSequence(counterKey: string): Promise<number>;
  getCurrentSequence(counterKey: string): Promise<number>;
  resetSequence(counterKey: string): Promise<void>;
}

/**
 * Factory function to create numbering service with database backend
 * This would be used in production to replace in-memory storage
 */
export function createNumberingService(repository: NumberingRepository) {
  return {
    async generateQuoteNumber(existingNumbers: string[] = []): Promise<string> {
      // Implementation would use repository instead of in-memory store
      return generateQuoteNumber(DEFAULT_QUOTE_CONFIG, existingNumbers);
    },
    
    async generateInvoiceNumber(existingNumbers: string[] = []): Promise<string> {
      // Implementation would use repository instead of in-memory store
      return generateInvoiceNumber(DEFAULT_INVOICE_CONFIG, existingNumbers);
    }
  };
}
