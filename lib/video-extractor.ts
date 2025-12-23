/**
 * Video Extractor Service
 * Handles extraction of video information from YouTube and TikTok
 */

import { ParsedURL } from './url-parser';

// Quality types
export type VideoQuality = '360p' | '480p' | '720p' | '1080p' | '4k';
export type VideoFormat = 'mp4' | 'mp3';

export interface QualityOption {
  quality: VideoQuality;
  format: VideoFormat;
  fileSize: number; // in bytes
  bitrate?: number; // in kbps
  available: boolean;
  recommended: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number; // in seconds
  platform: 'youtube' | 'tiktok';
  qualities: QualityOption[];
}

// Bitrate mappings for different qualities (in kbps)
const VIDEO_BITRATES: Record<VideoQuality, number> = {
  '360p': 1000,
  '480p': 2500,
  '720p': 5000,
  '1080p': 8000,
  '4k': 20000,
};

// Audio bitrate for MP3 extraction (in kbps)
const AUDIO_BITRATE = 128;

/**
 * Estimates file size based on bitrate and duration
 * @param bitrate - Bitrate in kbps
 * @param duration - Duration in seconds
 * @returns Estimated file size in bytes
 */
export function estimateFileSize(bitrate: number, duration: number): number {
  // Formula: (bitrate in kbps * duration in seconds) / 8 * 1000 = bytes
  // Simplified: bitrate * duration * 125
  return Math.round(bitrate * duration * 125);
}


/**
 * Calculates the recommended quality based on original video quality
 * @param availableQualities - Array of available quality options
 * @param originalQuality - The original quality of the video (optional)
 * @returns The recommended quality
 */
export function getRecommendedQuality(
  availableQualities: VideoQuality[],
  originalQuality?: VideoQuality
): VideoQuality {
  const qualityOrder: VideoQuality[] = ['4k', '1080p', '720p', '480p', '360p'];
  
  // If original quality is provided and available, recommend it
  if (originalQuality && availableQualities.includes(originalQuality)) {
    return originalQuality;
  }
  
  // Otherwise, recommend the highest available quality
  for (const quality of qualityOrder) {
    if (availableQualities.includes(quality)) {
      return quality;
    }
  }
  
  // Fallback to 720p if nothing else is available
  return '720p';
}

/**
 * Gets available quality options for a video
 * @param duration - Video duration in seconds
 * @param availableQualities - Array of available quality strings
 * @param originalQuality - The original quality of the video (optional)
 * @returns Array of QualityOption objects
 */
export function getAvailableQualities(
  duration: number,
  availableQualities: VideoQuality[],
  originalQuality?: VideoQuality
): QualityOption[] {
  const allQualities: VideoQuality[] = ['360p', '480p', '720p', '1080p', '4k'];
  const recommendedQuality = getRecommendedQuality(availableQualities, originalQuality);
  
  const options: QualityOption[] = [];
  
  // Add video quality options (MP4)
  for (const quality of allQualities) {
    const isAvailable = availableQualities.includes(quality);
    const bitrate = VIDEO_BITRATES[quality];
    
    options.push({
      quality,
      format: 'mp4',
      fileSize: isAvailable ? estimateFileSize(bitrate, duration) : 0,
      bitrate,
      available: isAvailable,
      recommended: isAvailable && quality === recommendedQuality,
    });
  }
  
  // Add MP3 audio option (always available if video is available)
  if (availableQualities.length > 0) {
    options.push({
      quality: '360p', // Base quality for audio
      format: 'mp3',
      fileSize: estimateFileSize(AUDIO_BITRATE, duration),
      bitrate: AUDIO_BITRATE,
      available: true,
      recommended: false,
    });
  }
  
  return options;
}


/**
 * Simulated YouTube video metadata
 * In a real implementation, this would fetch from YouTube API or scrape the page
 */
interface YouTubeVideoMetadata {
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  availableQualities: VideoQuality[];
  originalQuality: VideoQuality;
}

/**
 * Simulates fetching YouTube video metadata
 * In production, this would use YouTube Data API or yt-dlp
 * @param videoId - The YouTube video ID
 * @returns Simulated video metadata
 */
function simulateYouTubeMetadata(videoId: string): YouTubeVideoMetadata {
  // Simulate different video qualities based on video ID hash
  const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Determine available qualities based on hash
  const allQualities: VideoQuality[] = ['360p', '480p', '720p', '1080p', '4k'];
  const qualityIndex = hash % 5;
  const availableQualities = allQualities.slice(0, qualityIndex + 1);
  
  // Ensure at least 360p is available
  if (!availableQualities.includes('360p')) {
    availableQualities.unshift('360p');
  }
  
  // Simulate duration (1-10 minutes)
  const duration = 60 + (hash % 540);
  
  return {
    title: `YouTube Video ${videoId}`,
    description: `Description for video ${videoId}. This is a simulated video description.`,
    thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    duration,
    availableQualities,
    originalQuality: availableQualities[availableQualities.length - 1],
  };
}

/**
 * Extracts video information from a YouTube URL
 * @param parsedUrl - The parsed URL object
 * @returns Promise resolving to VideoInfo
 * @throws Error if extraction fails
 */
export async function extractYouTubeVideoInfo(parsedUrl: ParsedURL): Promise<VideoInfo> {
  if (parsedUrl.platform !== 'youtube') {
    throw new Error('Invalid platform: expected YouTube URL');
  }
  
  // In a real implementation, this would fetch from YouTube API
  // For now, we simulate the metadata
  const metadata = simulateYouTubeMetadata(parsedUrl.videoId);
  
  const qualities = getAvailableQualities(
    metadata.duration,
    metadata.availableQualities,
    metadata.originalQuality
  );
  
  return {
    id: parsedUrl.videoId,
    title: metadata.title,
    description: metadata.description,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    platform: 'youtube',
    qualities,
  };
}


/**
 * Simulated TikTok video metadata
 * In a real implementation, this would fetch from TikTok API or scrape the page
 */
interface TikTokVideoMetadata {
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  availableQualities: VideoQuality[];
  originalQuality: VideoQuality;
  author: string;
}

/**
 * Simulates fetching TikTok video metadata
 * In production, this would use TikTok API or scraping
 * @param videoId - The TikTok video ID
 * @returns Simulated video metadata
 */
function simulateTikTokMetadata(videoId: string): TikTokVideoMetadata {
  // Simulate different video qualities based on video ID hash
  const hash = videoId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // TikTok typically has fewer quality options than YouTube
  const tiktokQualities: VideoQuality[] = ['360p', '480p', '720p', '1080p'];
  const qualityIndex = Math.min(hash % 4, 3);
  const availableQualities = tiktokQualities.slice(0, qualityIndex + 1);
  
  // Ensure at least 360p is available
  if (!availableQualities.includes('360p')) {
    availableQualities.unshift('360p');
  }
  
  // TikTok videos are typically shorter (15-60 seconds)
  const duration = 15 + (hash % 45);
  
  return {
    title: `TikTok Video ${videoId.substring(0, 8)}...`,
    description: `TikTok video description. #trending #viral`,
    thumbnail: `https://p16-sign.tiktokcdn.com/obj/${videoId}`,
    duration,
    availableQualities,
    originalQuality: availableQualities[availableQualities.length - 1],
    author: `@user_${hash % 10000}`,
  };
}

/**
 * Extracts video information from a TikTok URL
 * @param parsedUrl - The parsed URL object
 * @returns Promise resolving to VideoInfo
 * @throws Error if extraction fails
 */
export async function extractTikTokVideoInfo(parsedUrl: ParsedURL): Promise<VideoInfo> {
  if (parsedUrl.platform !== 'tiktok') {
    throw new Error('Invalid platform: expected TikTok URL');
  }
  
  // In a real implementation, this would fetch from TikTok API
  // For now, we simulate the metadata
  const metadata = simulateTikTokMetadata(parsedUrl.videoId);
  
  const qualities = getAvailableQualities(
    metadata.duration,
    metadata.availableQualities,
    metadata.originalQuality
  );
  
  return {
    id: parsedUrl.videoId,
    title: metadata.title,
    description: metadata.description,
    thumbnail: metadata.thumbnail,
    duration: metadata.duration,
    platform: 'tiktok',
    qualities,
  };
}


/**
 * Extracts video information from a parsed URL
 * Automatically detects platform and calls appropriate extractor
 * @param parsedUrl - The parsed URL object
 * @returns Promise resolving to VideoInfo
 * @throws Error if extraction fails or platform is unsupported
 */
export async function extractVideoInfo(parsedUrl: ParsedURL): Promise<VideoInfo> {
  switch (parsedUrl.platform) {
    case 'youtube':
      return extractYouTubeVideoInfo(parsedUrl);
    case 'tiktok':
      return extractTikTokVideoInfo(parsedUrl);
    default:
      throw new Error(`Unsupported platform: ${parsedUrl.platform}`);
  }
}
