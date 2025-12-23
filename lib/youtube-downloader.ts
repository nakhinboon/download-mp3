/**
 * YouTube Downloader Service
 * Real implementation using @distube/ytdl-core
 */

import ytdl from "@distube/ytdl-core";

export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  author: string;
  formats: YouTubeFormat[];
}

export interface YouTubeFormat {
  itag: number;
  quality: string;
  qualityLabel: string | null;
  container: string;
  hasVideo: boolean;
  hasAudio: boolean;
  contentLength: string | undefined;
  bitrate: number | undefined;
  audioBitrate: number | undefined;
}

/**
 * Fetches real video info from YouTube
 */
export async function getYouTubeVideoInfo(url: string): Promise<YouTubeVideoInfo> {
  const info = await ytdl.getInfo(url);
  
  const formats: YouTubeFormat[] = info.formats.map((f) => ({
    itag: f.itag,
    quality: f.quality || "unknown",
    qualityLabel: f.qualityLabel || null,
    container: f.container || "unknown",
    hasVideo: f.hasVideo || false,
    hasAudio: f.hasAudio || false,
    contentLength: f.contentLength,
    bitrate: f.bitrate,
    audioBitrate: f.audioBitrate,
  }));

  return {
    id: info.videoDetails.videoId,
    title: info.videoDetails.title,
    description: info.videoDetails.description || "",
    thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1]?.url || "",
    duration: parseInt(info.videoDetails.lengthSeconds, 10),
    author: info.videoDetails.author.name,
    formats,
  };
}

/**
 * Gets the best format for a given quality preference
 */
export function getBestFormat(
  formats: YouTubeFormat[],
  preferredQuality: string,
  audioOnly: boolean
): YouTubeFormat | null {
  if (audioOnly) {
    // Find best audio-only format
    const audioFormats = formats
      .filter((f) => f.hasAudio && !f.hasVideo)
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0));
    return audioFormats[0] || null;
  }

  // Find format matching quality with both video and audio
  const qualityMap: Record<string, string[]> = {
    "360p": ["360p", "360p60"],
    "480p": ["480p", "480p60"],
    "720p": ["720p", "720p60"],
    "1080p": ["1080p", "1080p60"],
    "4k": ["2160p", "2160p60", "4k"],
  };

  const targetQualities = qualityMap[preferredQuality] || [preferredQuality];
  
  // First try to find format with both video and audio
  for (const quality of targetQualities) {
    const format = formats.find(
      (f) => f.qualityLabel === quality && f.hasVideo && f.hasAudio
    );
    if (format) return format;
  }

  // Fallback to any format with the quality
  for (const quality of targetQualities) {
    const format = formats.find((f) => f.qualityLabel === quality && f.hasVideo);
    if (format) return format;
  }

  // Fallback to highest quality with both video and audio
  const combinedFormats = formats
    .filter((f) => f.hasVideo && f.hasAudio)
    .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
  
  return combinedFormats[0] || null;
}

/**
 * Creates a download stream for a YouTube video
 */
export function createDownloadStream(
  url: string,
  options: { quality?: string; audioOnly?: boolean } = {}
) {
  const { audioOnly = false } = options;

  if (audioOnly) {
    return ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
    });
  }

  return ytdl(url, {
    filter: "audioandvideo",
    quality: "highest",
  });
}

/**
 * Validates if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  return ytdl.validateURL(url);
}

/**
 * Extracts video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  try {
    return ytdl.getVideoID(url);
  } catch {
    return null;
  }
}
