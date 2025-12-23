"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VideoInfo, QualityOption } from "@/lib/video-extractor";
import { DownloadTask, startDownload } from "@/lib/download-manager";
import { Download, Music, Video, Star } from "lucide-react";

interface QualitySelectorProps {
  videoInfo: VideoInfo;
  selectedQuality: QualityOption | null;
  onQualitySelect: (quality: QualityOption) => void;
  onDownloadStart: (task: DownloadTask) => void;
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
  onDownloadStart,
}: QualitySelectorProps) {
  const mp4Options = videoInfo.qualities.filter((q) => q.format === "mp4");
  const mp3Option = videoInfo.qualities.find((q) => q.format === "mp3");

  const handleQualityChange = (value: string) => {
    const [format, quality] = value.split("-");
    const option = videoInfo.qualities.find(
      (q) => q.format === format && q.quality === quality
    );
    if (option) {
      onQualitySelect(option);
    }
  };

  const handleDownload = () => {
    if (!selectedQuality) return;
    
    try {
      const task = startDownload(videoInfo, selectedQuality);
      onDownloadStart(task);
    } catch (error) {
      console.error("Failed to start download:", error);
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
            <Select value={getSelectValue()} onValueChange={handleQualityChange}>
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
                      {!option.available && (
                        <span className="text-muted-foreground">(ไม่พร้อมใช้งาน)</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
                {mp3Option && (
                  <SelectItem
                    value={`mp3-${mp3Option.quality}`}
                    disabled={!mp3Option.available}
                  >
                    <div className="flex items-center gap-2">
                      <Music className="h-4 w-4" />
                      <span>MP3 - Audio Only</span>
                      {!mp3Option.available && (
                        <span className="text-muted-foreground">(ไม่พร้อมใช้งาน)</span>
                      )}
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
                <span className="text-sm">
                  {formatFileSize(selectedQuality.fileSize)}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  เลือกคุณภาพเพื่อดูขนาดไฟล์
                </span>
              )}
            </div>
          </div>
        </div>

        {selectedQuality && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline">
              {selectedQuality.format.toUpperCase()}
            </Badge>
            <Badge variant="outline">{selectedQuality.quality}</Badge>
            {selectedQuality.bitrate && (
              <Badge variant="outline">{selectedQuality.bitrate} kbps</Badge>
            )}
            {selectedQuality.recommended && (
              <Badge variant="default" className="bg-yellow-500">
                <Star className="h-3 w-3 mr-1" />
                แนะนำ
              </Badge>
            )}
          </div>
        )}

        <Button
          onClick={handleDownload}
          disabled={!selectedQuality || !selectedQuality.available}
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          ดาวน์โหลด
        </Button>
      </CardContent>
    </Card>
  );
}
