/**
 * Video Info API Endpoint
 * GET /api/video-info?url=...
 * Fetches real video information from YouTube
 */

import { NextRequest, NextResponse } from "next/server";
import { getYouTubeVideoInfo, isValidYouTubeUrl } from "@/lib/youtube-downloader";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL", code: "MISSING_URL" },
        { status: 400 }
      );
    }

    // Validate YouTube URL
    if (!isValidYouTubeUrl(url)) {
      return NextResponse.json(
        { error: "URL YouTube ไม่ถูกต้อง", code: "INVALID_URL" },
        { status: 400 }
      );
    }

    const videoInfo = await getYouTubeVideoInfo(url);
    const duration = videoInfo.duration; // in seconds

    // Estimate file sizes based on bitrate and duration
    // Formula: (bitrate in kbps * duration in seconds * 1000) / 8 = bytes
    const estimateSize = (bitrateKbps: number) => Math.round((bitrateKbps * duration * 1000) / 8);

    // Typical bitrates for each quality (video + audio combined)
    const qualityBitrates: Record<string, number> = {
      "360p": 700,   // ~700 kbps
      "480p": 1500,  // ~1.5 Mbps
      "720p": 3000,  // ~3 Mbps
      "1080p": 6000, // ~6 Mbps
    };

    // Transform to frontend format - yt-dlp can merge any quality
    const qualities = [];
    const qualityLabels = ["360p", "480p", "720p", "1080p"];
    
    for (const label of qualityLabels) {
      const format = videoInfo.formats.find(
        (f) => f.qualityLabel === label && f.hasVideo
      );
      const estimatedBitrate = qualityBitrates[label] || 3000;
      const fileSize = format?.contentLength 
        ? parseInt(format.contentLength, 10) 
        : estimateSize(estimatedBitrate);
      
      qualities.push({
        quality: label,
        format: "mp4",
        fileSize,
        bitrate: format?.bitrate || estimatedBitrate * 1000,
        available: true,
        recommended: label === "1080p",
      });
    }

    // Add MP3 option - 320kbps
    qualities.push({
      quality: "320kbps",
      format: "mp3",
      fileSize: estimateSize(320), // 320 kbps
      bitrate: 320,
      available: true,
      recommended: false,
    });

    return NextResponse.json({
      id: videoInfo.id,
      title: videoInfo.title,
      description: videoInfo.description,
      thumbnail: videoInfo.thumbnail,
      duration: videoInfo.duration,
      platform: "youtube",
      author: videoInfo.author,
      qualities,
      originalUrl: url,
    });
  } catch (error) {
    console.error("Video info error:", error);
    const message = error instanceof Error ? error.message : "ไม่สามารถดึงข้อมูลวิดีโอได้";
    return NextResponse.json(
      { error: message, code: "FETCH_ERROR" },
      { status: 500 }
    );
  }
}
