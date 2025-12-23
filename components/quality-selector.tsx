"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoInfo, QualityOption } from "@/lib/video-extractor";
import { Download, Music, Video, Star, Loader2, CheckCircle } from "lucide-react";

interface QualitySelectorProps {
  videoInfo: VideoInfo;
  selectedQuality: QualityOption | null;
  onQualitySelect: (quality: QualityOption) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "N/A";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function QualitySelector({
  videoInfo,
  selectedQuality,
  onQualitySelect,
}: QualitySelectorProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "processing" | "downloading" | "complete" | "error">("idle");
  const [statusText, setStatusText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const mp4Options = videoInfo.qualities.filter((q) => q.format === "mp4");
  const mp3Option = videoInfo.qualities.find((q) => q.format === "mp3");

  // Reset state when video changes
  useEffect(() => {
    setProgress(0);
    setDownloadStatus("idle");
    setError(null);
  }, [videoInfo.id]);

  const handleQualityChange = (value: string) => {
    const [format, quality] = value.split("-");
    const option = videoInfo.qualities.find(
      (q) => q.format === format && q.quality === quality
    );
    if (option) {
      onQualitySelect(option);
    }
  };

  const handleDownload = async () => {
    if (!selectedQuality || !videoInfo.originalUrl) return;

    setIsDownloading(true);
    setDownloadStatus("processing");
    setStatusText("กำลังเตรียมไฟล์จาก YouTube...");
    setProgress(0);
    setError(null);

    abortControllerRef.current = new AbortController();

    // Simulate progress during server processing (yt-dlp download)
    let fakeProgress = 0;
    progressIntervalRef.current = setInterval(() => {
      fakeProgress += Math.random() * 3;
      if (fakeProgress > 85) fakeProgress = 85;
      setProgress(fakeProgress);
    }, 500);

    try {
      const params = new URLSearchParams({
        url: videoInfo.originalUrl,
        format: selectedQuality.format,
        quality: selectedQuality.quality,
      });

      const response = await fetch(`/api/download?${params.toString()}`, {
        signal: abortControllerRef.current.signal,
      });

      // Clear fake progress
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "ดาวน์โหลดล้มเหลว");
      }

      setDownloadStatus("downloading");
      setStatusText("กำลังรับไฟล์...");
      setProgress(90);

      const contentLength = response.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : selectedQuality.fileSize;

      const reader = response.body?.getReader();
      if (!reader) throw new Error("ไม่สามารถอ่านข้อมูลได้");

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        received += value.length;

        if (total > 0) {
          // Map 90-100% for actual file transfer
          setProgress(90 + (received / total) * 10);
        }
      }

      // Combine chunks and create blob
      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const combined = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      const blob = new Blob([combined]);
      const url = URL.createObjectURL(blob);

      // Trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `${videoInfo.title}.${selectedQuality.format === "mp3" ? "mp3" : "mp4"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      setDownloadStatus("complete");
      setStatusText("ดาวน์โหลดเสร็จสิ้น!");

      // Reset after 3 seconds
      setTimeout(() => {
        setDownloadStatus("idle");
        setProgress(0);
        setStatusText("");
      }, 3000);
    } catch (err) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      
      if (err instanceof Error && err.name === "AbortError") {
        setDownloadStatus("idle");
      } else {
        console.error("Download error:", err);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดาวน์โหลด");
        setDownloadStatus("error");
        setStatusText("เกิดข้อผิดพลาด");
      }
    } finally {
      setIsDownloading(false);
      abortControllerRef.current = null;
    }
  };

  const getSelectValue = () => {
    if (!selectedQuality) return undefined;
    return `${selectedQuality.format}-${selectedQuality.quality}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">เลือกคุณภาพ</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">รูปแบบและคุณภาพ</label>
            <Select 
              value={getSelectValue()} 
              onValueChange={handleQualityChange}
              disabled={isDownloading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="เลือกคุณภาพ" />
              </SelectTrigger>
              <SelectContent>
                {mp4Options.map((option) => (
                  <SelectItem
                    key={`mp4-${option.quality}`}
                    value={`mp4-${option.quality}`}
                    disabled={!option.available}
                  >
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span>MP4 - {option.quality}</span>
                      {option.recommended && (
                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                  </SelectItem>
                ))}
                {mp3Option && (
                  <SelectItem value={`mp3-${mp3Option.quality}`}>
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>MP3 - {mp3Option.quality}</span>
                    </div>
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">ขนาดไฟล์โดยประมาณ</label>
            <div className="h-9 flex items-center px-3 border rounded-md bg-muted/50">
              {selectedQuality ? (
                <span className="text-sm">{formatFileSize(selectedQuality.fileSize)}</span>
              ) : (
                <span className="text-sm text-muted-foreground">เลือกคุณภาพเพื่อดูขนาดไฟล์</span>
              )}
            </div>
          </div>
        </div>

        {selectedQuality && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">{selectedQuality.format.toUpperCase()}</Badge>
            <Badge variant="outline">{selectedQuality.quality}</Badge>
            {selectedQuality.recommended && (
              <Badge variant="default" className="bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                แนะนำ
              </Badge>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {downloadStatus !== "idle" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{statusText}</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <Button
          onClick={handleDownload}
          disabled={!selectedQuality || !selectedQuality.available || isDownloading}
          className="w-full"
          size="lg"
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : downloadStatus === "complete" ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {isDownloading
            ? "กำลังดาวน์โหลด..."
            : downloadStatus === "complete"
              ? "ดาวน์โหลดเสร็จสิ้น!"
              : "ดาวน์โหลด"}
        </Button>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
      </CardContent>
    </Card>
  );
}
