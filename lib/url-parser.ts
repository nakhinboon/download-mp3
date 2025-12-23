/**
 * URL Parser Service
 * Handles parsing and validation of YouTube and TikTok URLs
 */

export interface ParsedURL {
  platform: 'youtube' | 'tiktok';
  videoId: string;
  originalUrl: string;
}

// YouTube URL patterns
const YOUTUBE_PATTERNS = [
  // Standard watch URLs: youtube.com/watch?v=VIDEO_ID
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})(?:&.*)?$/,
  // Short URLs: youtu.be/VIDEO_ID
  /^(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  // Embed URLs: youtube.com/embed/VIDEO_ID
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
  // Shorts URLs: youtube.com/shorts/VIDEO_ID
  /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})(?:\?.*)?$/,
];

// TikTok URL patterns
const TIKTOK_PATTERNS = [
  // Standard video URLs: tiktok.com/@username/video/VIDEO_ID
  /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@[\w.-]+\/video\/(\d+)(?:\?.*)?$/,
  // Short URLs: vm.tiktok.com/VIDEO_ID
  /^(?:https?:\/\/)?(?:vm\.)?tiktok\.com\/([a-zA-Z0-9]+)\/?(?:\?.*)?$/,
  // Mobile URLs: m.tiktok.com/v/VIDEO_ID
  /^(?:https?:\/\/)?m\.tiktok\.com\/v\/(\d+)(?:\?.*)?$/,
];

/**
 * Validates if a string is a valid YouTube URL
 * @param url - The URL string to validate
 * @returns true if the URL is a valid YouTube URL, false otherwise
 */
export function validateYouTubeURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  return YOUTUBE_PATTERNS.some(pattern => pattern.test(trimmedUrl));
}

/**
 * Validates if a string is a valid TikTok URL
 * @param url - The URL string to validate
 * @returns true if the URL is a valid TikTok URL, false otherwise
 */
export function validateTikTokURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }
  
  const trimmedUrl = url.trim();
  return TIKTOK_PATTERNS.some(pattern => pattern.test(trimmedUrl));
}


/**
 * Extracts the video ID from a YouTube or TikTok URL
 * @param url - The URL string to extract the video ID from
 * @returns The video ID if found, null otherwise
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const trimmedUrl = url.trim();
  
  // Try YouTube patterns first
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Try TikTok patterns
  for (const pattern of TIKTOK_PATTERNS) {
    const match = trimmedUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Parses a URL and returns structured information about the video
 * @param url - The URL string to parse
 * @returns ParsedURL object if valid, null if invalid or unsupported
 */
export function parseURL(url: string): ParsedURL | null {
  if (!url || typeof url !== 'string') {
    return null;
  }
  
  const trimmedUrl = url.trim();
  
  // Check if it's a YouTube URL
  if (validateYouTubeURL(trimmedUrl)) {
    const videoId = extractVideoId(trimmedUrl);
    if (videoId) {
      return {
        platform: 'youtube',
        videoId,
        originalUrl: trimmedUrl,
      };
    }
  }
  
  // Check if it's a TikTok URL
  if (validateTikTokURL(trimmedUrl)) {
    const videoId = extractVideoId(trimmedUrl);
    if (videoId) {
      return {
        platform: 'tiktok',
        videoId,
        originalUrl: trimmedUrl,
      };
    }
  }
  
  return null;
}
