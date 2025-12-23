/**
 * Download Manager Service
 * Handles download operations including start, pause, resume, cancel, and progress tracking
 * Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 7.1, 7.2, 7.3, 7.4
 */

import { VideoInfo, QualityOption } from './video-extractor';

// Download status types
export type DownloadStatus = 'pending' | 'downloading' | 'paused' | 'completed' | 'failed';

// Download progress interface
export interface DownloadProgress {
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // in seconds
}

// Download task interface
export interface DownloadTask {
  id: string;
  videoInfo: VideoInfo;
  quality: QualityOption;
  status: DownloadStatus;
  progress: DownloadProgress;
  startedAt: number;
  pausedAt?: number;
  completedAt?: number;
  error?: string;
}

// Audio extraction result interface
export interface AudioExtractionResult {
  success: boolean;
  filePath?: string;
  bitrate: number;
  duration: number;
  metadata?: AudioMetadata;
  error?: string;
}

// Audio metadata interface
export interface AudioMetadata {
  title: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
}

// Minimum audio bitrate for MP3 extraction (128kbps as per Requirements 2.3)
export const MIN_AUDIO_BITRATE = 128;

// In-memory storage for active downloads (in production, this would use a database or persistent storage)
const activeDownloads: Map<string, DownloadTask> = new Map();

// Simulated download intervals for progress updates
const downloadIntervals: Map<string, NodeJS.Timeout> = new Map();

/**
 * Generates a unique download task ID
 * @returns A unique string ID
 */
function generateTaskId(): string {
  return `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}


/**
 * Creates initial download progress object
 * @param totalBytes - Total file size in bytes
 * @returns Initial DownloadProgress object
 */
function createInitialProgress(totalBytes: number): DownloadProgress {
  return {
    percentage: 0,
    downloadedBytes: 0,
    totalBytes,
    speed: 0,
    estimatedTimeRemaining: 0,
  };
}

/**
 * Calculates download progress percentage
 * @param downloadedBytes - Number of bytes downloaded
 * @param totalBytes - Total file size in bytes
 * @returns Percentage between 0 and 100
 */
export function calculatePercentage(downloadedBytes: number, totalBytes: number): number {
  if (totalBytes <= 0) {
    return 0;
  }
  const percentage = (downloadedBytes / totalBytes) * 100;
  // Clamp between 0 and 100
  return Math.min(100, Math.max(0, Math.round(percentage * 100) / 100));
}

/**
 * Calculates estimated time remaining based on download speed
 * @param remainingBytes - Number of bytes remaining to download
 * @param speed - Current download speed in bytes per second
 * @returns Estimated time remaining in seconds
 */
export function calculateETA(remainingBytes: number, speed: number): number {
  if (speed <= 0 || remainingBytes <= 0) {
    return 0;
  }
  return Math.ceil(remainingBytes / speed);
}

/**
 * Updates download progress with new values
 * @param task - The download task to update
 * @param downloadedBytes - New downloaded bytes count
 * @param speed - Current download speed
 * @returns Updated DownloadProgress object
 */
function updateProgress(
  task: DownloadTask,
  downloadedBytes: number,
  speed: number
): DownloadProgress {
  const totalBytes = task.progress.totalBytes;
  const remainingBytes = totalBytes - downloadedBytes;
  
  return {
    percentage: calculatePercentage(downloadedBytes, totalBytes),
    downloadedBytes,
    totalBytes,
    speed,
    estimatedTimeRemaining: calculateETA(remainingBytes, speed),
  };
}


/**
 * Starts a new download task
 * Requirements: 1.2, 1.3
 * @param videoInfo - Video information object
 * @param quality - Selected quality option
 * @returns The created DownloadTask
 * @throws Error if quality is not available
 */
export function startDownload(videoInfo: VideoInfo, quality: QualityOption): DownloadTask {
  if (!quality.available) {
    throw new Error('Selected quality is not available for this video');
  }
  
  const taskId = generateTaskId();
  const totalBytes = quality.fileSize;
  
  const task: DownloadTask = {
    id: taskId,
    videoInfo,
    quality,
    status: 'downloading',
    progress: createInitialProgress(totalBytes),
    startedAt: Date.now(),
  };
  
  activeDownloads.set(taskId, task);
  
  // Simulate download progress (in production, this would be actual download logic)
  simulateDownloadProgress(taskId);
  
  return task;
}

/**
 * Simulates download progress for testing purposes
 * In production, this would be replaced with actual download logic
 * @param taskId - The task ID to simulate progress for
 */
function simulateDownloadProgress(taskId: string): void {
  const task = activeDownloads.get(taskId);
  if (!task) return;
  
  // Simulate download speed (500KB/s to 2MB/s)
  const baseSpeed = 500000 + Math.random() * 1500000;
  
  const interval = setInterval(() => {
    const currentTask = activeDownloads.get(taskId);
    if (!currentTask || currentTask.status !== 'downloading') {
      clearInterval(interval);
      downloadIntervals.delete(taskId);
      return;
    }
    
    // Simulate speed variation
    const speed = baseSpeed * (0.8 + Math.random() * 0.4);
    const bytesPerInterval = speed * 0.1; // 100ms interval
    const newDownloadedBytes = Math.min(
      currentTask.progress.downloadedBytes + bytesPerInterval,
      currentTask.progress.totalBytes
    );
    
    currentTask.progress = updateProgress(currentTask, newDownloadedBytes, speed);
    
    // Check if download is complete
    if (currentTask.progress.percentage >= 100) {
      currentTask.status = 'completed';
      currentTask.completedAt = Date.now();
      currentTask.progress.percentage = 100;
      currentTask.progress.downloadedBytes = currentTask.progress.totalBytes;
      currentTask.progress.estimatedTimeRemaining = 0;
      clearInterval(interval);
      downloadIntervals.delete(taskId);
    }
  }, 100);
  
  downloadIntervals.set(taskId, interval);
}


/**
 * Pauses an active download
 * Requirements: 7.4
 * @param taskId - The ID of the download task to pause
 * @throws Error if task not found or cannot be paused
 */
export function pauseDownload(taskId: string): void {
  const task = activeDownloads.get(taskId);
  
  if (!task) {
    throw new Error(`Download task not found: ${taskId}`);
  }
  
  if (task.status !== 'downloading') {
    throw new Error(`Cannot pause download with status: ${task.status}`);
  }
  
  // Stop the simulation interval
  const interval = downloadIntervals.get(taskId);
  if (interval) {
    clearInterval(interval);
    downloadIntervals.delete(taskId);
  }
  
  task.status = 'paused';
  task.pausedAt = Date.now();
  task.progress.speed = 0;
}

/**
 * Resumes a paused download
 * Requirements: 7.4
 * @param taskId - The ID of the download task to resume
 * @throws Error if task not found or cannot be resumed
 */
export function resumeDownload(taskId: string): void {
  const task = activeDownloads.get(taskId);
  
  if (!task) {
    throw new Error(`Download task not found: ${taskId}`);
  }
  
  if (task.status !== 'paused') {
    throw new Error(`Cannot resume download with status: ${task.status}`);
  }
  
  task.status = 'downloading';
  task.pausedAt = undefined;
  
  // Resume the simulation
  simulateDownloadProgress(taskId);
}

/**
 * Cancels a download task
 * Requirements: 7.4
 * @param taskId - The ID of the download task to cancel
 * @throws Error if task not found
 */
export function cancelDownload(taskId: string): void {
  const task = activeDownloads.get(taskId);
  
  if (!task) {
    throw new Error(`Download task not found: ${taskId}`);
  }
  
  // Stop the simulation interval
  const interval = downloadIntervals.get(taskId);
  if (interval) {
    clearInterval(interval);
    downloadIntervals.delete(taskId);
  }
  
  // Remove from active downloads
  activeDownloads.delete(taskId);
}


/**
 * Gets the current progress of a download task
 * Requirements: 7.1, 7.2, 7.3
 * @param taskId - The ID of the download task
 * @returns The current DownloadProgress
 * @throws Error if task not found
 */
export function getProgress(taskId: string): DownloadProgress {
  const task = activeDownloads.get(taskId);
  
  if (!task) {
    throw new Error(`Download task not found: ${taskId}`);
  }
  
  return { ...task.progress };
}

/**
 * Gets a download task by ID
 * @param taskId - The ID of the download task
 * @returns The DownloadTask or undefined if not found
 */
export function getDownloadTask(taskId: string): DownloadTask | undefined {
  const task = activeDownloads.get(taskId);
  return task ? { ...task, progress: { ...task.progress } } : undefined;
}

/**
 * Gets all active download tasks
 * @returns Array of all active DownloadTask objects
 */
export function getAllDownloads(): DownloadTask[] {
  return Array.from(activeDownloads.values()).map(task => ({
    ...task,
    progress: { ...task.progress },
  }));
}

/**
 * Clears all completed or failed downloads from memory
 */
export function clearCompletedDownloads(): void {
  for (const [taskId, task] of activeDownloads.entries()) {
    if (task.status === 'completed' || task.status === 'failed') {
      activeDownloads.delete(taskId);
    }
  }
}


/**
 * Validates audio bitrate meets minimum requirements
 * Requirements: 2.3
 * @param bitrate - The bitrate in kbps
 * @returns true if bitrate meets minimum requirement
 */
export function validateAudioBitrate(bitrate: number): boolean {
  return bitrate >= MIN_AUDIO_BITRATE;
}

/**
 * Extracts audio from a video as MP3
 * Requirements: 2.1, 2.2, 2.3
 * @param videoInfo - Video information object
 * @param targetBitrate - Target bitrate in kbps (minimum 128kbps)
 * @param metadata - Optional audio metadata to embed
 * @returns AudioExtractionResult
 */
export async function extractAudio(
  videoInfo: VideoInfo,
  targetBitrate: number = MIN_AUDIO_BITRATE,
  metadata?: Partial<AudioMetadata>
): Promise<AudioExtractionResult> {
  // Ensure minimum bitrate requirement is met
  const actualBitrate = Math.max(targetBitrate, MIN_AUDIO_BITRATE);
  
  // Validate video info
  if (!videoInfo || !videoInfo.id) {
    return {
      success: false,
      bitrate: 0,
      duration: 0,
      error: 'Invalid video information provided',
    };
  }
  
  // Find MP3 quality option
  const mp3Quality = videoInfo.qualities.find(q => q.format === 'mp3');
  if (!mp3Quality || !mp3Quality.available) {
    return {
      success: false,
      bitrate: 0,
      duration: 0,
      error: 'MP3 format is not available for this video',
    };
  }
  
  // Build audio metadata
  const audioMetadata: AudioMetadata = {
    title: metadata?.title || videoInfo.title,
    artist: metadata?.artist,
    album: metadata?.album,
    year: metadata?.year,
    genre: metadata?.genre,
  };
  
  // In production, this would use ffmpeg or similar to extract audio
  // For now, we simulate the extraction
  const filePath = `downloads/${videoInfo.id}.mp3`;
  
  return {
    success: true,
    filePath,
    bitrate: actualBitrate,
    duration: videoInfo.duration,
    metadata: audioMetadata,
  };
}

/**
 * Creates an MP3 download task with audio extraction
 * Requirements: 2.1, 2.2, 2.3
 * @param videoInfo - Video information object
 * @param metadata - Optional audio metadata
 * @returns The created DownloadTask for MP3
 * @throws Error if MP3 quality is not available
 */
export function startMP3Download(
  videoInfo: VideoInfo,
  metadata?: Partial<AudioMetadata>
): DownloadTask {
  // Find MP3 quality option
  const mp3Quality = videoInfo.qualities.find(q => q.format === 'mp3');
  
  if (!mp3Quality || !mp3Quality.available) {
    throw new Error('MP3 format is not available for this video');
  }
  
  // Ensure bitrate meets minimum requirement
  if (mp3Quality.bitrate && mp3Quality.bitrate < MIN_AUDIO_BITRATE) {
    throw new Error(`Audio bitrate must be at least ${MIN_AUDIO_BITRATE}kbps`);
  }
  
  // Start the download with MP3 quality
  const task = startDownload(videoInfo, mp3Quality);
  
  // Store metadata for later use during extraction (if provided)
  if (metadata) {
    (task as DownloadTask & { audioMetadata?: Partial<AudioMetadata> }).audioMetadata = metadata;
  }
  
  return task;
}

// Export for testing purposes
export function _clearAllDownloads(): void {
  for (const interval of downloadIntervals.values()) {
    clearInterval(interval);
  }
  downloadIntervals.clear();
  activeDownloads.clear();
}
