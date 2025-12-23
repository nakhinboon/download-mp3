/**
 * Video Info API Endpoint
 * POST /api/video-info
 * Accepts a URL and returns video information
 * 
 * Requirements: 1.1, 4.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { parseURL } from '@/lib/url-parser';
import { extractVideoInfo } from '@/lib/video-extractor';

export interface VideoInfoRequest {
  url: string;
}

export interface VideoInfoErrorResponse {
  error: string;
  code: 'INVALID_URL' | 'UNSUPPORTED_PLATFORM' | 'EXTRACTION_FAILED' | 'MISSING_URL';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as VideoInfoRequest;
    
    // Validate request body
    if (!body.url || typeof body.url !== 'string') {
      return NextResponse.json<VideoInfoErrorResponse>(
        { error: 'กรุณาใส่ URL', code: 'MISSING_URL' },
        { status: 400 }
      );
    }

    const url = body.url.trim();
    
    // Parse and validate URL
    const parsedUrl = parseURL(url);
    
    if (!parsedUrl) {
      return NextResponse.json<VideoInfoErrorResponse>(
        { error: 'กรุณาใส่ URL ที่ถูกต้อง รองรับเฉพาะ YouTube และ TikTok เท่านั้น', code: 'INVALID_URL' },
        { status: 400 }
      );
    }

    // Extract video information
    const videoInfo = await extractVideoInfo(parsedUrl);
    
    return NextResponse.json(videoInfo, { status: 200 });
    
  } catch (error) {
    console.error('Video info extraction error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'ไม่สามารถดึงข้อมูลวิดีโอได้';
    
    return NextResponse.json<VideoInfoErrorResponse>(
      { error: errorMessage, code: 'EXTRACTION_FAILED' },
      { status: 500 }
    );
  }
}
