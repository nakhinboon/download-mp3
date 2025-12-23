/**
 * Test Download API - for debugging
 */

import { NextRequest, NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const logs: string[] = [];
  
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get("url") || "https://www.youtube.com/watch?v=l7r3nPuO-wc";
    
    logs.push(`1. URL: ${url}`);

    // Clean URL
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.delete("list");
      urlObj.searchParams.delete("start_radio");
      url = urlObj.toString();
      logs.push(`2. Cleaned URL: ${url}`);
    } catch (e) {
      logs.push(`2. URL clean error: ${e}`);
    }

    // Validate
    const isValid = ytdl.validateURL(url);
    logs.push(`3. Valid URL: ${isValid}`);

    if (!isValid) {
      return NextResponse.json({ logs, error: "Invalid URL" });
    }

    // Get info
    logs.push("4. Getting video info...");
    const info = await ytdl.getInfo(url);
    logs.push(`5. Title: ${info.videoDetails.title}`);
    logs.push(`6. Formats count: ${info.formats.length}`);

    // List available formats
    const audioFormats = info.formats.filter(f => f.hasAudio && !f.hasVideo);
    const videoFormats = info.formats.filter(f => f.hasAudio && f.hasVideo);
    
    logs.push(`7. Audio-only formats: ${audioFormats.length}`);
    logs.push(`8. Video+Audio formats: ${videoFormats.length}`);

    // Choose format
    logs.push("9. Choosing format...");
    const selectedFormat = ytdl.chooseFormat(info.formats, {
      filter: "audioonly",
      quality: "highestaudio",
    });
    
    logs.push(`10. Selected format itag: ${selectedFormat.itag}`);
    logs.push(`11. Selected format URL exists: ${!!selectedFormat.url}`);
    logs.push(`12. Selected format mimeType: ${selectedFormat.mimeType}`);

    if (!selectedFormat.url) {
      return NextResponse.json({ logs, error: "No URL in format" });
    }

    // Test fetch
    logs.push("13. Testing fetch to YouTube...");
    const testResponse = await fetch(selectedFormat.url, {
      method: "HEAD",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.youtube.com/",
        "Origin": "https://www.youtube.com",
      },
    });
    
    logs.push(`14. Fetch status: ${testResponse.status}`);
    logs.push(`15. Content-Length: ${testResponse.headers.get("content-length")}`);

    return NextResponse.json({
      success: true,
      logs,
      downloadUrl: selectedFormat.url.substring(0, 100) + "...",
      contentLength: testResponse.headers.get("content-length"),
    });

  } catch (error) {
    logs.push(`ERROR: ${error instanceof Error ? error.message : String(error)}`);
    if (error instanceof Error && error.stack) {
      logs.push(`STACK: ${error.stack.split("\n").slice(0, 3).join(" | ")}`);
    }
    return NextResponse.json({ success: false, logs, error: String(error) });
  }
}
