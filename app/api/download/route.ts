/**
 * Download API Endpoint
 * Uses yt-dlp for reliable YouTube downloads
 */

import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, unlink, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Temp directory for downloads
const TEMP_DIR = path.join(process.cwd(), "tmp");

async function ensureTempDir() {
  if (!existsSync(TEMP_DIR)) {
    await mkdir(TEMP_DIR, { recursive: true });
  }
}

// Helper to clean up all temp files with given prefix
async function cleanupTempFiles(prefix: string) {
  try {
    const files = await readdir(TEMP_DIR);
    const baseName = path.basename(prefix);
    for (const file of files) {
      if (file.startsWith(baseName)) {
        try {
          await unlink(path.join(TEMP_DIR, file));
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let url = searchParams.get("url");
    const format = searchParams.get("format") || "mp4";
    const quality = searchParams.get("quality") || "1080p";

    if (!url) {
      return NextResponse.json({ error: "กรุณาระบุ URL" }, { status: 400 });
    }

    // Clean URL
    try {
      const urlObj = new URL(url);
      urlObj.searchParams.delete("list");
      urlObj.searchParams.delete("start_radio");
      urlObj.searchParams.delete("index");
      url = urlObj.toString();
    } catch {
      // Keep original
    }

    await ensureTempDir();

    // Build yt-dlp command with explicit output path
    let cmd: string;
    let ext: string;
    const fileId = randomUUID();
    const outputTemplate = path.join(TEMP_DIR, fileId);
    
    if (format === "mp3") {
      ext = "mp3";
      // Use best audio quality (320kbps) with high quality conversion
      cmd = `yt-dlp -x --audio-format mp3 --audio-quality 0 --postprocessor-args "-b:a 320k" -P "${TEMP_DIR}" -o "${fileId}.%(ext)s" "${url}"`;
    } else {
      ext = "mp4";
      // Map quality to yt-dlp format selector
      const qualityMap: Record<string, string> = {
        "360p": "bestvideo[height<=360][ext=mp4]+bestaudio[ext=m4a]/best[height<=360][ext=mp4]/best[height<=360]",
        "480p": "bestvideo[height<=480][ext=mp4]+bestaudio[ext=m4a]/best[height<=480][ext=mp4]/best[height<=480]",
        "720p": "bestvideo[height<=720][ext=mp4]+bestaudio[ext=m4a]/best[height<=720][ext=mp4]/best[height<=720]",
        "1080p": "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080][ext=mp4]/best[height<=1080]",
      };
      const formatSelector = qualityMap[quality] || qualityMap["1080p"];
      cmd = `yt-dlp -f "${formatSelector}" --merge-output-format mp4 -P "${TEMP_DIR}" -o "${fileId}.%(ext)s" "${url}"`;
    }

    console.log("Running yt-dlp:", cmd);
    console.log("Output will be:", `${outputTemplate}.${ext}`);

    // Execute yt-dlp
    const { stdout, stderr } = await execAsync(cmd, { 
      timeout: 300000,
      maxBuffer: 50 * 1024 * 1024 
    });
    
    console.log("yt-dlp stdout:", stdout);
    if (stderr) console.log("yt-dlp stderr:", stderr);

    // Find the output file
    const outputFile = `${outputTemplate}.${ext}`;
    
    if (!existsSync(outputFile)) {
      // List files to debug
      console.log("Expected file not found:", outputFile);
      try {
        const files = await readdir(TEMP_DIR);
        console.log("Files in tmp:", files);
        
        // Try to find file with our ID
        const matchingFile = files.find(f => f.startsWith(fileId));
        if (matchingFile) {
          const actualFile = path.join(TEMP_DIR, matchingFile);
          console.log("Found matching file:", actualFile);
          
          const fileBuffer = await readFile(actualFile);
          const titleMatch = stdout.match(/\[download\] Destination: .*?([^\\\/]+)\.\w+$/m);
          const title = titleMatch ? titleMatch[1] : "download";
          const actualExt = path.extname(matchingFile).slice(1) || ext;
          const filename = `${title}.${actualExt}`;
          
          // Clean up
          await cleanupTempFiles(outputTemplate);
          
          const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";
          return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
              "Content-Type": contentType,
              "Content-Length": fileBuffer.length.toString(),
              "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
              "Cache-Control": "no-store",
            },
          });
        }
      } catch (e) {
        console.log("Error listing files:", e);
      }
      return NextResponse.json({ error: "ไฟล์ไม่ถูกสร้าง" }, { status: 500 });
    }

    // Read file
    const fileBuffer = await readFile(outputFile);
    
    // Get title from yt-dlp output or use default
    const titleMatch = stdout.match(/\[download\] Destination: .*?([^\\\/]+)\.\w+$/m);
    const title = titleMatch ? titleMatch[1] : "download";
    const filename = `${title}.${ext}`;

    // Clean up temp file and any related files
    await cleanupTempFiles(outputTemplate);

    const contentType = format === "mp3" ? "audio/mpeg" : "video/mp4";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Download error:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Download failed" },
      { status: 500 }
    );
  }
}
