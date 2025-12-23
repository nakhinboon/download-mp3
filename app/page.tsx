"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { URLInput } from "@/components/url-input";
import { VideoInfoDisplay } from "@/components/video-info-display";
import { QualitySelector } from "@/components/quality-selector";
import { DownloadHistory } from "@/components/download-history";
import { VideoInfo, QualityOption } from "@/lib/video-extractor";

export default function Home() {
  const [platform, setPlatform] = useState<"youtube" | "tiktok">("youtube");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<QualityOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleVideoInfoLoaded = (info: VideoInfo) => {
    setVideoInfo(info);
    setSelectedQuality(null);
    setError(null);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    setVideoInfo(null);
    setSelectedQuality(null);
  };

  const handleQualitySelect = (quality: QualityOption) => {
    setSelectedQuality(quality);
  };

  const handleReset = () => {
    setVideoInfo(null);
    setSelectedQuality(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 py-8 px-4">
      <main className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Media Downloader</CardTitle>
            <CardDescription>
              ดาวน์โหลดวิดีโอจาก YouTube และ TikTok ในรูปแบบ MP3 และ MP4
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs
              value={platform}
              onValueChange={(value) => {
                setPlatform(value as "youtube" | "tiktok");
                handleReset();
              }}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="youtube">YouTube</TabsTrigger>
                <TabsTrigger value="tiktok">TikTok</TabsTrigger>
              </TabsList>

              <TabsContent value="youtube" className="mt-6 space-y-6">
                <URLInput
                  platform="youtube"
                  onVideoInfoLoaded={handleVideoInfoLoaded}
                  onError={handleError}
                />
              </TabsContent>

              <TabsContent value="tiktok" className="mt-6 space-y-6">
                <URLInput
                  platform="tiktok"
                  onVideoInfoLoaded={handleVideoInfoLoaded}
                  onError={handleError}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {videoInfo && (
          <VideoInfoDisplay videoInfo={videoInfo} />
        )}

        {videoInfo && (
          <QualitySelector
            videoInfo={videoInfo}
            selectedQuality={selectedQuality}
            onQualitySelect={handleQualitySelect}
          />
        )}

        <DownloadHistory />
      </main>
    </div>
  );
}
