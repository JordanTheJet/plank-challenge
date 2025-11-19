/**
 * Custom hook for MediaPipe Pose detection
 * Handles initialization, detection loop, and plank validation
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PoseLandmarker, NormalizedLandmark } from '@mediapipe/tasks-vision';
import { PlankDetectionResult, detectPlankPosition } from '@/lib/poseDetection';
import { loadPoseLandmarker, cleanupPoseLandmarker } from '@/lib/mediapipeLoader';

/**
 * Exponential Moving Average (EMA) filter for landmark smoothing
 * Reduces jitter while maintaining responsiveness to real movement
 * @param alpha - Smoothing factor (0-1): higher = more responsive, lower = smoother
 */
function smoothLandmarks(
  currentLandmarks: NormalizedLandmark[],
  previousLandmarks: NormalizedLandmark[] | null,
  alpha: number = 0.3
): NormalizedLandmark[] {
  if (!previousLandmarks) {
    return currentLandmarks;
  }

  return currentLandmarks.map((current, index) => {
    const previous = previousLandmarks[index];
    if (!previous) {
      return current;
    }

    // Apply EMA filter: smoothed = alpha * current + (1 - alpha) * previous
    return {
      x: alpha * current.x + (1 - alpha) * previous.x,
      y: alpha * current.y + (1 - alpha) * previous.y,
      z: alpha * current.z + (1 - alpha) * previous.z,
      visibility: current.visibility, // Don't smooth visibility (binary property)
    };
  });
}

export interface UsePoseDetectionOptions {
  onPlankDetected?: () => void;
  onPlankLost?: () => void;
  enableDetection?: boolean;
  stabilityFrames?: number; // Number of consecutive frames needed to confirm detection
  gracePeriodFrames?: number; // Number of frames to wait before confirming plank lost
  adaptiveFps?: boolean; // Enable adaptive FPS based on device performance (default: true)
  minFps?: number; // Minimum FPS when under load (default: 5)
  maxFps?: number; // Maximum FPS when performing well (default: 15)
}

export interface UsePoseDetectionReturn {
  isReady: boolean;
  isProcessing: boolean;
  error: string | null;
  detectionResult: PlankDetectionResult | null;
  detectPose: (video: HTMLVideoElement) => void;
  reset: () => void;
}

export function usePoseDetection({
  onPlankDetected,
  onPlankLost,
  enableDetection = true,
  stabilityFrames = 15, // Increased from 5: need ~1.5 seconds of stable plank to start
  gracePeriodFrames = 50, // Increased from 10: give ~5 seconds grace before stopping
  adaptiveFps = true,
  minFps = 5,
  maxFps = 15,
}: UsePoseDetectionOptions = {}): UsePoseDetectionReturn {
  const [isReady, setIsReady] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detectionResult, setDetectionResult] = useState<PlankDetectionResult | null>(null);

  const poseLandmarkerRef = useRef<PoseLandmarker | null>(null);
  const plankDetectedCountRef = useRef(0);
  const plankLostCountRef = useRef(0);
  const isPlankActiveRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const lastResultRef = useRef<any>(null); // Store last result for cleanup
  const smoothedLandmarksRef = useRef<NormalizedLandmark[] | null>(null); // Store smoothed landmarks for EMA filter

  // Adaptive FPS state
  const detectionDurationsRef = useRef<number[]>([]); // Store recent detection durations
  const currentFpsRef = useRef<number>(maxFps); // Current target FPS
  const frameTimeThresholdRef = useRef<number>(1000 / maxFps); // Current frame time threshold in ms

  // Initialize MediaPipe Pose (with dynamic loading for code splitting)
  useEffect(() => {
    if (!enableDetection) return;

    let mounted = true;

    async function initializePoseLandmarker() {
      try {
        setIsProcessing(true);

        // Dynamic import - MediaPipe is loaded only when needed
        // This significantly reduces initial bundle size
        const poseLandmarker = await loadPoseLandmarker();

        if (!mounted) return;

        poseLandmarkerRef.current = poseLandmarker;
        setIsReady(true);
        setIsProcessing(false);
      } catch (err) {
        console.error('Failed to initialize pose detection:', err);
        if (mounted) {
          setError('Failed to load pose detection. Please refresh the page.');
          setIsProcessing(false);
        }
      }
    }

    initializePoseLandmarker();

    return () => {
      mounted = false;

      // Clean up last result
      if (lastResultRef.current) {
        lastResultRef.current = null;
      }

      // Note: We don't cleanup the MediaPipe instance here to allow reuse
      // Call cleanupPoseLandmarker() explicitly when app unmounts if needed
      poseLandmarkerRef.current = null;
    };
  }, [enableDetection]);

  // Detect pose from video frame
  const detectPose = useCallback((video: HTMLVideoElement) => {
    if (!poseLandmarkerRef.current || !isReady || !video) return;

    try {
      const now = performance.now();

      // Adaptive FPS throttling based on device performance
      const frameTimeSinceLastDetection = now - lastDetectionTimeRef.current;
      if (frameTimeSinceLastDetection < frameTimeThresholdRef.current) return;

      const detectionStartTime = performance.now();
      lastDetectionTimeRef.current = now;

      // Clean up previous result to prevent memory accumulation
      if (lastResultRef.current) {
        // MediaPipe results hold internal buffers that need to be released
        lastResultRef.current = null;
      }

      // Detect pose landmarks
      const result = poseLandmarkerRef.current.detectForVideo(video, now);

      // Store reference for cleanup on next iteration
      lastResultRef.current = result;

      if (result.landmarks && result.landmarks.length > 0) {
        // Get first person's landmarks
        const rawLandmarks = result.landmarks[0];

        // Apply temporal smoothing to reduce jitter
        // EMA filter with alpha=0.3 balances smoothness and responsiveness
        const smoothedLandmarks = smoothLandmarks(rawLandmarks, smoothedLandmarksRef.current, 0.3);
        smoothedLandmarksRef.current = smoothedLandmarks;

        // Detect if it's a plank position using smoothed landmarks
        const plankResult = detectPlankPosition(smoothedLandmarks);
        setDetectionResult(plankResult);

        // Handle plank detection with stability filter
        if (plankResult.isPlank) {
          plankDetectedCountRef.current++;
          plankLostCountRef.current = 0;

          // Confirm plank detected after consecutive frames
          if (
            !isPlankActiveRef.current &&
            plankDetectedCountRef.current >= stabilityFrames
          ) {
            isPlankActiveRef.current = true;
            onPlankDetected?.();
          }
        } else {
          plankLostCountRef.current++;
          plankDetectedCountRef.current = 0;

          // Confirm plank lost after grace period
          if (
            isPlankActiveRef.current &&
            plankLostCountRef.current >= gracePeriodFrames
          ) {
            isPlankActiveRef.current = false;
            onPlankLost?.();
          }
        }
      } else {
        // No person detected
        setDetectionResult({
          isPlank: false,
          confidence: 0,
          feedback: ['No person detected. Position yourself in frame.'],
        });

        plankLostCountRef.current++;
        plankDetectedCountRef.current = 0;

        // Confirm plank lost if was previously active
        if (
          isPlankActiveRef.current &&
          plankLostCountRef.current >= gracePeriodFrames
        ) {
          isPlankActiveRef.current = false;
          onPlankLost?.();
        }
      }

      // Adaptive FPS: Adjust frame rate based on detection performance
      if (adaptiveFps) {
        const detectionDuration = performance.now() - detectionStartTime;
        detectionDurationsRef.current.push(detectionDuration);

        // Keep only last 10 measurements for rolling average
        if (detectionDurationsRef.current.length > 10) {
          detectionDurationsRef.current.shift();
        }

        // Calculate average detection time every 10 frames
        if (detectionDurationsRef.current.length === 10) {
          const avgDetectionTime = detectionDurationsRef.current.reduce((a, b) => a + b, 0) / 10;

          // Adjust FPS based on average detection time
          // If detection is taking too long, reduce FPS
          // If detection is fast, increase FPS (up to maxFps)
          if (avgDetectionTime > 80) {
            // Detection taking >80ms, reduce to minFps
            currentFpsRef.current = minFps;
          } else if (avgDetectionTime > 50) {
            // Detection taking >50ms, reduce FPS moderately
            currentFpsRef.current = Math.max(minFps, Math.floor(maxFps * 0.6));
          } else if (avgDetectionTime < 30) {
            // Detection fast, increase to maxFps
            currentFpsRef.current = maxFps;
          } else {
            // Detection moderate, use middle FPS
            currentFpsRef.current = Math.floor((minFps + maxFps) / 2);
          }

          frameTimeThresholdRef.current = 1000 / currentFpsRef.current;

          // Log FPS adjustment in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`Adaptive FPS: ${currentFpsRef.current} FPS (avg detection: ${avgDetectionTime.toFixed(1)}ms)`);
          }
        }
      }
    } catch (err: any) {
      console.error('Error during pose detection:', err);

      // Handle specific MediaPipe error codes
      if (err?.code === 5 || err?.message?.includes('Internal error')) {
        // Error code 5 is a MediaPipe internal error (often memory/GPU related)
        console.warn('MediaPipe error code 5 - attempting to recover');
        setError('Detection error - try refreshing if issue persists');

        // Don't crash the app, just skip this frame
        return;
      }

      setError('Detection error occurred');
    }
  }, [isReady, onPlankDetected, onPlankLost, stabilityFrames, gracePeriodFrames, adaptiveFps, minFps, maxFps]);

  // Reset detection state
  const reset = useCallback(() => {
    plankDetectedCountRef.current = 0;
    plankLostCountRef.current = 0;
    isPlankActiveRef.current = false;
    lastDetectionTimeRef.current = 0;

    // Clean up last result
    if (lastResultRef.current) {
      lastResultRef.current = null;
    }

    // Reset smoothed landmarks for fresh start
    smoothedLandmarksRef.current = null;

    // Reset adaptive FPS state
    detectionDurationsRef.current = [];
    currentFpsRef.current = maxFps;
    frameTimeThresholdRef.current = 1000 / maxFps;

    setDetectionResult(null);
    setError(null);
  }, [maxFps]);

  return {
    isReady,
    isProcessing,
    error,
    detectionResult,
    detectPose,
    reset,
  };
}
