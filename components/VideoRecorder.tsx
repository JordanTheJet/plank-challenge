'use client';

import { useEffect, useRef, useState } from 'react';
import { VideoRecorder as Recorder, getCameraStream, downloadBlob } from '@/utils/videoRecorder';
import { formatDuration, generateFilename, getDayNumber } from '@/utils/timerLogic';
import { format } from 'date-fns';

interface VideoRecorderProps {
  targetDuration: number;
  onComplete: () => void;
  onError: (error: string) => void;
}

type RecordingPhase = 'preparing' | 'countdown' | 'recording' | 'preview' | 'completed';

export default function VideoRecorder({ targetDuration, onComplete, onError }: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [phase, setPhase] = useState<RecordingPhase>('preparing');
  const [countdown, setCountdown] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isRestarting, setIsRestarting] = useState(false);
  const [finalFrameData, setFinalFrameData] = useState<string | null>(null);

  // Initialize camera and setup canvas
  useEffect(() => {
    let mounted = true;

    async function setupCamera() {
      try {
        const stream = await getCameraStream();

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => resolve();
          }
        });

        // Start countdown
        if (mounted) {
          setPhase('countdown');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to access camera';
        setError(errorMsg);
        onError(errorMsg);
      }
    }

    setupCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [onError]);

  // Handle countdown
  useEffect(() => {
    if (phase !== 'countdown') return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase('recording');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Handle video rendering to canvas (for both preview and recording)
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (!canvas || !video || phase === 'preparing' || phase === 'completed' || phase === 'preview') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    // Start recording if in recording phase
    if (phase === 'recording') {
      const canvasStream = canvas.captureStream(30); // 30 FPS
      recorderRef.current = new Recorder();
      recorderRef.current.start(canvasStream);
      startTimeRef.current = Date.now();
    }

    // Animation loop to draw video (and timer overlay during recording)
    const drawFrame = () => {
      if (!ctx || !video) return;
      if (phase !== 'countdown' && phase !== 'recording') return;

      // Draw video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // During recording, also draw timer overlay
      if (phase === 'recording') {
        const elapsed = Math.floor((Date.now() - (startTimeRef.current || 0)) / 1000);
        setElapsedTime(elapsed);

        // Draw timer overlay
        drawTimerOverlay(ctx, canvas.width, canvas.height, elapsed);

        // Check if target duration reached (capture final frame at exact target)
        if (elapsed >= targetDuration) {
          // Capture final frame before stopping
          const finalFrame = canvas.toDataURL('image/png');
          setFinalFrameData(finalFrame);
          stopRecording();
          return;
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [phase, targetDuration]);

  const drawTimerOverlay = (ctx: CanvasRenderingContext2D, width: number, height: number, seconds: number) => {
    const timeText = formatDuration(seconds);
    const fontSize = Math.min(width, height) * 0.15; // Responsive font size

    // Semi-transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(width * 0.25, height * 0.05, width * 0.5, fontSize * 1.5);

    // Timer text
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(timeText, width / 2, height * 0.05 + fontSize * 0.75);

    // Target duration indicator (smaller text below)
    const targetText = `/ ${formatDuration(targetDuration)}`;
    const smallFontSize = fontSize * 0.4;
    ctx.font = `${smallFontSize}px monospace`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(targetText, width / 2, height * 0.05 + fontSize * 1.3);
  };

  const stopRecording = async () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (recorderRef.current && recorderRef.current.isRecording()) {
      try {
        const blob = await recorderRef.current.stop();
        setVideoBlob(blob);
        setPhase('preview');
      } catch (err) {
        const errorMsg = 'Failed to save video';
        setError(errorMsg);
        onError(errorMsg);
      }
    }
  };

  const handleRestart = () => {
    // Debounce: prevent rapid clicking
    if (isRestarting) return;
    setIsRestarting(true);

    // Stop current recording if active
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (recorderRef.current && recorderRef.current.isRecording()) {
      recorderRef.current.stop().catch(() => {
        // Ignore errors during restart
      });
    }

    // Reset state and restart countdown
    setPhase('countdown');
    setCountdown(3);
    setElapsedTime(0);
    setVideoBlob(null);
    setFinalFrameData(null);

    // Clear debounce after 500ms
    setTimeout(() => {
      setIsRestarting(false);
    }, 500);
  };

  const handleDownloadVideo = () => {
    if (videoBlob) {
      const filename = generateFilename();
      downloadBlob(videoBlob, filename);
      setPhase('completed');

      // Stop camera stream after download
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      onComplete();
    }
  };

  const handleDownloadScreenshot = () => {
    if (finalFrameData) {
      const dayNumber = getDayNumber();
      const filename = `plank-day${dayNumber}-${format(new Date(), 'yyyyMMdd')}-screenshot.png`;

      // Download the captured final frame
      const a = document.createElement('a');
      a.href = finalFrameData;
      a.download = filename;
      a.click();
    }
  };

  const handleRecordAnother = () => {
    // Reset to countdown phase
    setPhase('countdown');
    setCountdown(3);
    setElapsedTime(0);
    setVideoBlob(null);
    setFinalFrameData(null);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg">
        <p className="text-red-600 text-center font-semibold mb-4">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      {/* Canvas for recording */}
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg shadow-2xl"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />

      {/* Video element (completely hidden, used only as source) */}
      <video
        ref={videoRef}
        style={{
          position: 'absolute',
          top: '-9999px',
          left: '-9999px',
          width: '1px',
          height: '1px',
          opacity: 0,
          pointerEvents: 'none'
        }}
        playsInline
        muted
      />

      {/* Countdown overlay */}
      {phase === 'countdown' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white text-9xl font-bold font-mono animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      {/* Preparing overlay */}
      {phase === 'preparing' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="text-white text-2xl font-semibold">
            Preparing camera...
          </div>
        </div>
      )}

      {/* Restart button (visible during countdown and recording) */}
      {(phase === 'countdown' || phase === 'recording') && (
        <button
          onClick={handleRestart}
          disabled={isRestarting}
          className="absolute top-4 right-4 px-4 py-2 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Restart
        </button>
      )}

      {/* Recording indicator */}
      {phase === 'recording' && (
        <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-red-600 px-4 py-2 rounded-full">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          <span className="text-white font-semibold">Recording</span>
        </div>
      )}

      {/* Preview screen */}
      {phase === 'preview' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-white text-center px-6 py-8">
            <div className="text-4xl mb-4">✓</div>
            <div className="text-2xl font-semibold mb-2">Great job!</div>
            <div className="text-lg mb-8">You held your plank for {formatDuration(targetDuration)}!</div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={handleDownloadVideo}
                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                Download Video
              </button>
              <button
                onClick={handleDownloadScreenshot}
                className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                Download Screenshot
              </button>
              <button
                onClick={handleRecordAnother}
                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
              >
                Record Another
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed message */}
      {phase === 'completed' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
          <div className="text-white text-center">
            <div className="text-4xl mb-4">✓</div>
            <div className="text-2xl font-semibold">Complete!</div>
            <div className="text-lg mt-2">Video downloading...</div>
          </div>
        </div>
      )}
    </div>
  );
}
