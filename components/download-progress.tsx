"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DownloadTask,
  getDownloadTask,
  pauseDownload,
  resumeDownload,
  cancelDownload,
} from "@/lib/download-manager";
import { saveDownload, createRecordFromDownload } from "@/lib/history-manager";
import { Pause, Play, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface DownloadProgressProps {
  task: DownloadTask;
  onComplete: () => void;
  onCancel: () => void;
}

function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return "0 B/s";
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(1024));
  return `${(bytesPerSecond / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

function formatTime(seconds: number): string {
  if (seconds === 0 || !isFinite(seconds)) return "--:--";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export function DownloadProgress({ task: initialTask, onComplete, onCancel }: DownloadProgressProps) {
  const [task, setTask] = useState<DownloadTask>(initialTask);
  const onCompleteRef = useRef(onComplete);
  const hasCalledComplete = useRef(false);
  const hasSavedToHistory = useRef(false);

  // Keep ref updated with latest callback
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const interval = setInterval(() => {
      const updatedTask = getDownloadTask(initialTask.id);
      if (updatedTask) {
        setTask(prev => {
          // Only update if something changed to avoid unnecessary re-renders
          if (prev.status === updatedTask.status && 
              prev.progress.percentage === updatedTask.progress.percentage) {
            return prev;
          }
          return updatedTask;
        });
        
        // Save to history only once when completed
        if (updatedTask.status === "completed" && !hasSavedToHistory.current) {
          hasSavedToHistory.current = true;
          const record = createRecordFromDownload(
            updatedTask.videoInfo,
            updatedTask.quality,
            updatedTask.videoInfo.id
          );
          saveDownload(record);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, [initialTask.id]);

  useEffect(() => {
    if (task.status === "completed" && !hasCalledComplete.current) {
      hasCalledComplete.current = true;
      const timeout = setTimeout(() => {
        onCompleteRef.current();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [task.status]);

  const handlePause = () => {
    try {
      pauseDownload(task.id);
      const updatedTask = getDownloadTask(task.id);
      if (updatedTask) setTask(updatedTask);
    } catch (error) {
      console.error("Failed to pause download:", error);
    }
  };

  const handleResume = () => {
    try {
      resumeDownload(task.id);
      const updatedTask = getDownloadTask(task.id);
      if (updatedTask) setTask(updatedTask);
    } catch (error) {
      console.error("Failed to resume download:", error);
    }
  };

  const handleCancel = () => {
    try {
      cancelDownload(task.id);
      onCancel();
    } catch (error) {
      console.error("Failed to cancel download:", error);
      onCancel();
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case "downloading":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (task.status) {
      case "pending":
        return "รอดำเนินการ";
      case "downloading":
        return "กำลังดาวน์โหลด";
      case "paused":
        return "หยุดชั่วคราว";
      case "completed":
        return "เสร็จสิ้น";
      case "failed":
        return "ล้มเหลว";
      default:
        return task.status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">กำลังดาวน์โหลด</CardTitle>
          <Badge variant="outline" className="flex items-center gap-1">
            {getStatusIcon()}
            {getStatusText()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium line-clamp-1">{task.videoInfo.title}</span>
            <span className="text-muted-foreground">
              {task.progress.percentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={task.progress.percentage} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">ความเร็ว</p>
            <p className="font-medium">{formatSpeed(task.progress.speed)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">ดาวน์โหลดแล้ว</p>
            <p className="font-medium">
              {formatFileSize(task.progress.downloadedBytes)} /{" "}
              {formatFileSize(task.progress.totalBytes)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">เวลาที่เหลือ</p>
            <p className="font-medium">
              {formatTime(task.progress.estimatedTimeRemaining)}
            </p>
          </div>
        </div>

        {task.status !== "completed" && task.status !== "failed" && (
          <div className="flex gap-2">
            {task.status === "downloading" ? (
              <Button variant="outline" onClick={handlePause} className="flex-1">
                <Pause className="h-4 w-4 mr-2" />
                หยุดชั่วคราว
              </Button>
            ) : task.status === "paused" ? (
              <Button variant="outline" onClick={handleResume} className="flex-1">
                <Play className="h-4 w-4 mr-2" />
                ดำเนินการต่อ
              </Button>
            ) : null}
            <Button variant="destructive" onClick={handleCancel}>
              <X className="h-4 w-4 mr-2" />
              ยกเลิก
            </Button>
          </div>
        )}

        {task.status === "completed" && (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">ดาวน์โหลดเสร็จสิ้น!</span>
          </div>
        )}

        {task.status === "failed" && task.error && (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{task.error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
