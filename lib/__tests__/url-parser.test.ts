import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  parseURL,
  validateYouTubeURL,
  validateTikTokURL,
  extractVideoId,
} from '../url-parser';

describe('URL Parser Service', () => {
  describe('validateYouTubeURL', () => {
    it('should validate standard YouTube watch URLs', () => {
      expect(validateYouTubeURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(validateYouTubeURL('http://youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
      expect(validateYouTubeURL('youtube.com/watch?v=dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube short URLs', () => {
      expect(validateYouTubeURL('https://youtu.be/dQw4w9WgXcQ')).toBe(true);
      expect(validateYouTubeURL('youtu.be/dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube embed URLs', () => {
      expect(validateYouTubeURL('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe(true);
    });

    it('should validate YouTube shorts URLs', () => {
      expect(validateYouTubeURL('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe(true);
    });

    it('should reject invalid YouTube URLs', () => {
      expect(validateYouTubeURL('https://www.google.com')).toBe(false);
      expect(validateYouTubeURL('not a url')).toBe(false);
      expect(validateYouTubeURL('')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(validateYouTubeURL(null as unknown as string)).toBe(false);
      expect(validateYouTubeURL(undefined as unknown as string)).toBe(false);
    });
  });

  describe('validateTikTokURL', () => {
    it('should validate standard TikTok video URLs', () => {
      expect(validateTikTokURL('https://www.tiktok.com/@username/video/1234567890123456789')).toBe(true);
      expect(validateTikTokURL('tiktok.com/@user.name/video/1234567890123456789')).toBe(true);
    });

    it('should validate TikTok short URLs', () => {
      expect(validateTikTokURL('https://vm.tiktok.com/ZMxxxxxx/')).toBe(true);
      expect(validateTikTokURL('vm.tiktok.com/abc123')).toBe(true);
    });

    it('should validate TikTok mobile URLs', () => {
      expect(validateTikTokURL('https://m.tiktok.com/v/1234567890123456789')).toBe(true);
    });

    it('should reject invalid TikTok URLs', () => {
      expect(validateTikTokURL('https://www.google.com')).toBe(false);
      expect(validateTikTokURL('not a url')).toBe(false);
      expect(validateTikTokURL('')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(validateTikTokURL(null as unknown as string)).toBe(false);
      expect(validateTikTokURL(undefined as unknown as string)).toBe(false);
    });
  });

  describe('extractVideoId', () => {
    it('should extract video ID from YouTube URLs', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from TikTok URLs', () => {
      expect(extractVideoId('https://www.tiktok.com/@username/video/1234567890123456789')).toBe('1234567890123456789');
      expect(extractVideoId('https://vm.tiktok.com/ZMxxxxxx/')).toBe('ZMxxxxxx');
      expect(extractVideoId('https://m.tiktok.com/v/1234567890123456789')).toBe('1234567890123456789');
    });

    it('should return null for invalid URLs', () => {
      expect(extractVideoId('https://www.google.com')).toBeNull();
      expect(extractVideoId('not a url')).toBeNull();
      expect(extractVideoId('')).toBeNull();
      expect(extractVideoId(null as unknown as string)).toBeNull();
    });
  });

  describe('parseURL', () => {
    it('should parse YouTube URLs correctly', () => {
      const result = parseURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      expect(result).toEqual({
        platform: 'youtube',
        videoId: 'dQw4w9WgXcQ',
        originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      });
    });

    it('should parse TikTok URLs correctly', () => {
      const result = parseURL('https://www.tiktok.com/@username/video/1234567890123456789');
      expect(result).toEqual({
        platform: 'tiktok',
        videoId: '1234567890123456789',
        originalUrl: 'https://www.tiktok.com/@username/video/1234567890123456789',
      });
    });

    it('should return null for invalid URLs', () => {
      expect(parseURL('https://www.google.com')).toBeNull();
      expect(parseURL('not a url')).toBeNull();
      expect(parseURL('')).toBeNull();
      expect(parseURL(null as unknown as string)).toBeNull();
    });

    it('should trim whitespace from URLs', () => {
      const result = parseURL('  https://www.youtube.com/watch?v=dQw4w9WgXcQ  ');
      expect(result).not.toBeNull();
      expect(result?.videoId).toBe('dQw4w9WgXcQ');
    });
  });
});


/**
 * Property-Based Tests for URL Parser Service
 * Using fast-check for property-based testing
 */

// Characters allowed in YouTube video IDs
const youtubeIdChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';

// Generators for valid YouTube video IDs (11 characters, alphanumeric with - and _)
const youtubeVideoIdArb = fc.array(
  fc.constantFrom(...youtubeIdChars.split('')),
  { minLength: 11, maxLength: 11 }
).map(chars => chars.join(''));

// Generator for valid YouTube URLs
const validYouTubeUrlArb = fc.oneof(
  // Standard watch URL
  youtubeVideoIdArb.map(id => `https://www.youtube.com/watch?v=${id}`),
  // Short URL
  youtubeVideoIdArb.map(id => `https://youtu.be/${id}`),
  // Embed URL
  youtubeVideoIdArb.map(id => `https://www.youtube.com/embed/${id}`),
  // Shorts URL
  youtubeVideoIdArb.map(id => `https://www.youtube.com/shorts/${id}`)
);

// Characters allowed in TikTok video IDs (numeric only)
const tiktokIdChars = '0123456789';

// Generator for valid TikTok video IDs (numeric, 19 digits)
const tiktokVideoIdArb = fc.array(
  fc.constantFrom(...tiktokIdChars.split('')),
  { minLength: 19, maxLength: 19 }
).map(chars => chars.join(''));

// Characters allowed in TikTok usernames
const tiktokUsernameChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789._';

// Generator for TikTok usernames (alphanumeric with . and _)
const tiktokUsernameArb = fc.array(
  fc.constantFrom(...tiktokUsernameChars.split('')),
  { minLength: 1, maxLength: 24 }
).map(chars => chars.join(''));

// Generator for valid TikTok URLs
const validTikTokUrlArb = fc.oneof(
  // Standard video URL
  fc.tuple(tiktokUsernameArb, tiktokVideoIdArb).map(
    ([username, id]) => `https://www.tiktok.com/@${username}/video/${id}`
  ),
  // Mobile URL
  tiktokVideoIdArb.map(id => `https://m.tiktok.com/v/${id}`)
);

// Generator for invalid URLs (random strings that are not valid YouTube or TikTok URLs)
const invalidUrlArb = fc.oneof(
  fc.constant(''),
  fc.constant('not a url'),
  fc.constant('https://www.google.com'),
  fc.constant('https://www.facebook.com/video/123'),
  fc.constant('https://www.instagram.com/p/abc123'),
  fc.webUrl().filter(url => 
    !url.includes('youtube') && 
    !url.includes('youtu.be') && 
    !url.includes('tiktok')
  )
);

describe('Property-Based Tests', () => {
  /**
   * **Feature: media-downloader-seo, Property 1: YouTube URL Validation**
   * **Validates: Requirements 1.1, 1.4**
   * 
   * For any string input, the URL parser SHALL correctly identify valid YouTube URLs
   * and reject invalid ones, returning appropriate parsed data or null.
   */
  describe('Property 1: YouTube URL Validation', () => {
    it('should return true for all valid YouTube URLs', () => {
      fc.assert(
        fc.property(validYouTubeUrlArb, (url) => {
          return validateYouTubeURL(url) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should extract correct video ID from valid YouTube URLs', () => {
      fc.assert(
        fc.property(youtubeVideoIdArb, (videoId) => {
          const url = `https://www.youtube.com/watch?v=${videoId}`;
          const extracted = extractVideoId(url);
          return extracted === videoId;
        }),
        { numRuns: 100 }
      );
    });

    it('should parse valid YouTube URLs and return correct platform', () => {
      fc.assert(
        fc.property(validYouTubeUrlArb, (url) => {
          const result = parseURL(url);
          return result !== null && result.platform === 'youtube';
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid URLs that are not YouTube', () => {
      fc.assert(
        fc.property(invalidUrlArb, (url) => {
          return validateYouTubeURL(url) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve original URL in parsed result', () => {
      fc.assert(
        fc.property(validYouTubeUrlArb, (url) => {
          const result = parseURL(url);
          return result !== null && result.originalUrl === url;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * **Feature: media-downloader-seo, Property 2: TikTok URL Validation**
   * **Validates: Requirements 4.1, 4.4**
   * 
   * For any string input, the URL parser SHALL correctly identify valid TikTok URLs
   * and reject invalid ones, returning appropriate parsed data or null.
   */
  describe('Property 2: TikTok URL Validation', () => {
    it('should return true for all valid TikTok URLs', () => {
      fc.assert(
        fc.property(validTikTokUrlArb, (url) => {
          return validateTikTokURL(url) === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should extract correct video ID from valid TikTok URLs', () => {
      fc.assert(
        fc.property(fc.tuple(tiktokUsernameArb, tiktokVideoIdArb), ([username, videoId]) => {
          const url = `https://www.tiktok.com/@${username}/video/${videoId}`;
          const extracted = extractVideoId(url);
          return extracted === videoId;
        }),
        { numRuns: 100 }
      );
    });

    it('should parse valid TikTok URLs and return correct platform', () => {
      fc.assert(
        fc.property(validTikTokUrlArb, (url) => {
          const result = parseURL(url);
          return result !== null && result.platform === 'tiktok';
        }),
        { numRuns: 100 }
      );
    });

    it('should reject invalid URLs that are not TikTok', () => {
      fc.assert(
        fc.property(invalidUrlArb, (url) => {
          return validateTikTokURL(url) === false;
        }),
        { numRuns: 100 }
      );
    });

    it('should preserve original URL in parsed result', () => {
      fc.assert(
        fc.property(validTikTokUrlArb, (url) => {
          const result = parseURL(url);
          return result !== null && result.originalUrl === url;
        }),
        { numRuns: 100 }
      );
    });
  });
});
