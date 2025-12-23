"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, Search } from "lucide-react";
import { validateYouTubeURL, validateTikTokURL, parseURL } from "@/lib/url-parser";
import { extractVideoInfo, VideoInfo } from "@/lib/video-extractor";

interface URLInputProps {
  platform: "youtube" | "tiktok";
  onVideoInfoLoaded: (info: VideoInfo) => void;
  onError: (error: string) => void;
}

export function URLInput({ platform, onVideoInfoLoaded, onError }: URLInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateURL = (inputUrl: string): boolean => {
    if (!inputUrl.trim()) {
      setValidationError("กรุณาใส่ URL");
      return false;
    }

    if (platform === "youtube") {
      if (!validateYouTubeURL(inputUrl)) {
        setValidationError("กรุณาใส่ URL YouTube ที่ถูกต้อง");
        return false;
      }
    } else {
      if (!validateTikTokURL(inputUrl)) {
        setValidationError("กรุณาใส่ URL TikTok ที่ถูกต้อง");
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateURL(url)) {
      return;
    }

    setIsLoading(true);
    setValidationError(null);

    try {
      const parsedUrl = parseURL(url);
      if (!parsedUrl) {
        throw new Error("ไม่สามารถแยกวิเคราะห์ URL ได้");
      }

      const videoInfo = await extractVideoInfo(parsedUrl);
      onVideoInfoLoaded(videoInfo);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการดึงข้อมูลวิดีโอ";
      setValidationError(errorMessage);
      onError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
  };

  const placeholder = platform === "youtube"
    ? "วาง URL YouTube ที่นี่ (เช่น https://youtube.com/watch?v=...)"
    : "วาง URL TikTok ที่นี่ (เช่น https://tiktok.com/@user/video/...)";

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="url"
          placeholder={placeholder}
          value={url}
          onChange={handleInputChange}
          disabled={isLoading}
          aria-invalid={!!validationError}
          className="flex-1"
        />
        <Button type="submit" disabled={isLoading || !url.trim()}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          <span className="ml-2">{isLoading ? "กำลังโหลด..." : "ค้นหา"}</span>
        </Button>
      </form>

      {validationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>ข้อผิดพลาด</AlertTitle>
          <AlertDescription>{validationError}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
