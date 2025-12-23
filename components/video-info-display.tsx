"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoInfo } from "@/lib/video-extractor";
import { Clock, Film } from "lucide-react";

interface VideoInfoDisplayProps {
  videoInfo: VideoInfo;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

export function VideoInfoDisplay({ videoInfo }: VideoInfoDisplayProps) {
  const availableQualities = videoInfo.qualities
    .filter((q) => q.available && q.format === "mp4")
    .map((q) => q.quality);

  const hasMP3 = videoInfo.qualities.some((q) => q.format === "mp3" && q.available);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">ข้อมูลวิดีโอ</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-48 h-32 shrink-0 bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden">
            <Image
              src={videoInfo.thumbnail}
              alt={videoInfo.title}
              fill
              className="object-cover"
              unoptimized
              loading="lazy"
            />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="font-semibold text-base line-clamp-2">{videoInfo.title}</h3>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                <Film className="h-3 w-3 mr-1" />
                {videoInfo.platform}
              </Badge>
              <Badge variant="outline">
                <Clock className="h-3 w-3 mr-1" />
                {formatDuration(videoInfo.duration)}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {availableQualities.map((quality) => (
                <Badge key={quality} variant="secondary" className="text-xs">
                  {quality}
                </Badge>
              ))}
              {hasMP3 && (
                <Badge variant="default" className="text-xs">
                  MP3
                </Badge>
              )}
            </div>

            {videoInfo.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {videoInfo.description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
