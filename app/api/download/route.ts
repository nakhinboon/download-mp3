/**
 * Download API Endpoint
 * POST /api/download
 * Accepts video info and quality, returns download stream
 * 
 * Requirements: 1.2, 1.3, 2.1, 2.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { VideoInfo, QualityOption } from '@/lib/video-extractor';
import { startDownload, startMP3Download, getDownloadTask, DownloadTask } from '@/lib/download-manager';

export interface DownloadRequest {
  videoInfo: VideoInfo;
  quality: QualityOption;
  audioMetadata?: {
    title?: string;
    artist?: string;
    album?: string;
  };
}

export interface DownloadResponse {
  taskId: string;
  status: DownloadTask['status'];
  message: string;
}

export interface DownloadErrorResponse {
  error: string;
  code: 'INVALID_REQUEST' | 'QUALITY_UNAVAILABLE' | 'DOWNLOAD_FAILED' | 'MISSING_VIDEO_INFO';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DownloadRequest;
    
    // Validate request body
    if (!body.videoInfo || !body.videoInfo.id) {
      return NextResponse.json<DownloadErrorResponse>(
        { error: 'ข้อมูลวิดีโอไม่ถูกต้อง', code: 'MISSING_VIDEO_INFO' },
        { status: 400 }
      );
    }

    if (!body.quality) {
      return NextResponse.json<DownloadErrorResponse>(
        { error: 'กรุณาเลือกคุณภาพวิดีโอ', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    // Check if quality is available
    if (!body.quality.available) {
      return NextResponse.json<DownloadErrorResponse>(
        { error: 'คุณภาพที่เลือกไม่พร้อมใช้งานสำหรับวิดีโอนี้', code: 'QUALITY_UNAVAILABLE' },
        { status: 400 }
      );
    }

    let task: DownloadTask;

    // Start download based on format
    if (body.quality.format === 'mp3') {
      // MP3 audio extraction (Requirements: 2.1, 2.2)
      task = startMP3Download(body.videoInfo, body.audioMetadata);
    } else {
      // MP4 video download (Requirements: 1.2, 1.3)
      task = startDownload(body.videoInfo, body.quality);
    }

    const response: DownloadResponse = {
      taskId: task.id,
      status: task.status,
      message: 'เริ่มดาวน์โหลดแล้ว',
    };

    return NextResponse.json(response, { status: 200 });
    
  } catch (error) {
    console.error('Download error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถเริ่มดาวน์โหลดได้';
    
    return NextResponse.json<DownloadErrorResponse>(
      { error: errorMessage, code: 'DOWNLOAD_FAILED' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/download?taskId=xxx
 * Get download progress for a specific task
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json<DownloadErrorResponse>(
        { error: 'กรุณาระบุ taskId', code: 'INVALID_REQUEST' },
        { status: 400 }
      );
    }

    const task = getDownloadTask(taskId);

    if (!task) {
      return NextResponse.json<DownloadErrorResponse>(
        { error: 'ไม่พบงานดาวน์โหลด', code: 'INVALID_REQUEST' },
        { status: 404 }
      );
    }

    return NextResponse.json(task, { status: 200 });
    
  } catch (error) {
    console.error('Get download progress error:', error);
    
    return NextResponse.json<DownloadErrorResponse>(
      { error: 'ไม่สามารถดึงข้อมูลความคืบหน้าได้', code: 'DOWNLOAD_FAILED' },
      { status: 500 }
    );
  }
}
