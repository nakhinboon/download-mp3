/**
 * History Manager Service
 * Handles download history storage, retrieval, and management
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

// Download record interface matching the design document
export interface DownloadRecord {
  id: string;
  title: string;
  url: string;
  platform: 'youtube' | 'tiktok';
  format: 'mp4' | 'mp3';
  quality: string;
  downloadedAt: string; // ISO 8601 format
  fileSize: number;
}

// Storage key for localStorage
const HISTORY_STORAGE_KEY = 'media_downloader_history';

/**
 * Generates a unique record ID
 * @returns A unique string ID
 */
function generateRecordId(): string {
  return `rec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates that a value is a valid platform
 * @param value - The value to validate
 * @returns true if valid platform
 */
function isValidPlatform(value: unknown): value is 'youtube' | 'tiktok' {
  return value === 'youtube' || value === 'tiktok';
}

/**
 * Validates that a value is a valid format
 * @param value - The value to validate
 * @returns true if valid format
 */
function isValidFormat(value: unknown): value is 'mp4' | 'mp3' {
  return value === 'mp4' || value === 'mp3';
}

/**
 * Validates that a string is a valid ISO 8601 date
 * @param dateString - The date string to validate
 * @returns true if valid ISO 8601 date
 */
function isValidISODate(dateString: string): boolean {
  if (typeof dateString !== 'string') return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString === date.toISOString();
}


/**
 * Validates a single download record against the expected schema
 * Requirements: 8.5
 * @param record - The record to validate
 * @returns true if the record is valid
 */
export function validateDownloadRecord(record: unknown): record is DownloadRecord {
  if (!record || typeof record !== 'object') {
    return false;
  }

  const r = record as Record<string, unknown>;

  // Check required string fields
  if (typeof r.id !== 'string' || r.id.length === 0) return false;
  if (typeof r.title !== 'string' || r.title.length === 0) return false;
  if (typeof r.url !== 'string' || r.url.length === 0) return false;
  if (typeof r.quality !== 'string' || r.quality.length === 0) return false;
  if (typeof r.downloadedAt !== 'string' || !isValidISODate(r.downloadedAt)) return false;

  // Check platform and format enums
  if (!isValidPlatform(r.platform)) return false;
  if (!isValidFormat(r.format)) return false;

  // Check fileSize is a non-negative number
  if (typeof r.fileSize !== 'number' || r.fileSize < 0 || !Number.isFinite(r.fileSize)) {
    return false;
  }

  return true;
}

/**
 * Serializes download records to JSON string
 * Requirements: 8.4
 * @param records - Array of download records
 * @returns JSON string representation
 */
export function serializeHistory(records: DownloadRecord[]): string {
  return JSON.stringify(records);
}

/**
 * Parses and validates JSON string to download records
 * Requirements: 8.4, 8.5
 * @param jsonString - JSON string to parse
 * @returns Array of valid download records, or empty array if parsing fails
 */
export function parseHistory(jsonString: string): DownloadRecord[] {
  try {
    const parsed = JSON.parse(jsonString);
    
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Filter and return only valid records
    return parsed.filter(validateDownloadRecord);
  } catch {
    return [];
  }
}


/**
 * Checks if localStorage is available
 * @returns true if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const testKey = '__storage_test__';
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Saves a download record to history
 * Requirements: 8.1
 * @param record - The download record to save (without id and downloadedAt)
 * @returns The saved record with generated id and timestamp
 */
export function saveDownload(
  record: Omit<DownloadRecord, 'id' | 'downloadedAt'>
): DownloadRecord {
  const newRecord: DownloadRecord = {
    ...record,
    id: generateRecordId(),
    downloadedAt: new Date().toISOString(),
  };

  if (!isLocalStorageAvailable()) {
    // Return the record even if storage is unavailable (for SSR compatibility)
    return newRecord;
  }

  const history = getHistory();
  history.unshift(newRecord); // Add to beginning (most recent first)
  
  window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(history));
  
  return newRecord;
}

/**
 * Retrieves all download history records
 * Requirements: 8.2
 * @returns Array of download records, sorted by most recent first
 */
export function getHistory(): DownloadRecord[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  const stored = window.localStorage.getItem(HISTORY_STORAGE_KEY);
  
  if (!stored) {
    return [];
  }

  return parseHistory(stored);
}


/**
 * Clears all download history
 * Requirements: 8.3
 */
export function clearHistory(): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(HISTORY_STORAGE_KEY);
}

/**
 * Deletes a specific record from history by ID
 * Requirements: 8.3
 * @param id - The ID of the record to delete
 * @returns true if record was found and deleted, false otherwise
 */
export function deleteRecord(id: string): boolean {
  if (!isLocalStorageAvailable()) {
    return false;
  }

  const history = getHistory();
  const initialLength = history.length;
  const filteredHistory = history.filter(record => record.id !== id);

  if (filteredHistory.length === initialLength) {
    return false; // Record not found
  }

  window.localStorage.setItem(HISTORY_STORAGE_KEY, serializeHistory(filteredHistory));
  return true;
}

/**
 * Gets a specific record by ID
 * @param id - The ID of the record to retrieve
 * @returns The download record if found, undefined otherwise
 */
export function getRecordById(id: string): DownloadRecord | undefined {
  const history = getHistory();
  return history.find(record => record.id === id);
}

/**
 * Creates a download record from video info and quality selection
 * Helper function to create records from download completion
 * @param videoInfo - Video information object
 * @param quality - Selected quality option
 * @returns Partial record ready for saving
 */
export function createRecordFromDownload(
  videoInfo: { id: string; title: string; platform: 'youtube' | 'tiktok' },
  quality: { quality: string; format: 'mp4' | 'mp3'; fileSize: number },
  originalUrl: string
): Omit<DownloadRecord, 'id' | 'downloadedAt'> {
  return {
    title: videoInfo.title,
    url: originalUrl,
    platform: videoInfo.platform,
    format: quality.format,
    quality: quality.quality,
    fileSize: quality.fileSize,
  };
}
