/**
 * Custom hook for MediaPipe Pose detection
 * Handles initialization, detection loop, and plank validation
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { PlankDetectionResult, detectPlankPosition } from '@/lib/poseDetection';
import { loadPoseLandmarker, cleanupPoseLandmarker } from '@/lib/mediapipeLoader';

export interface UsePoseDetectionOptions {
  onPlankDetected?: () => void;
  onPlankLost?: () => void;
  enableDetection?: boolean;
  stabilityFrames?: number; // Number of consecutive frames needed to confirm detection
  gracePeriodFrames?: number; // Number of frames to wait before confirming plank lost
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
  stabilityFrames = 5,
  gracePeriodFrames = 10,
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

      // Throttle detection to ~10 FPS for better stability (reduces memory pressure)
      if (now - lastDetectionTimeRef.current < 100) return;
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
        const landmarks = result.landmarks[0];

        // Detect if it's a plank position
        const plankResult = detectPlankPosition(landmarks);
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
  }, [isReady, onPlankDetected, onPlankLost, stabilityFrames, gracePeriodFrames]);

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

    setDetectionResult(null);
    setError(null);
  }, []);

  return {
    isReady,
    isProcessing,
    error,
    detectionResult,
    detectPose,
    reset,
  };
}
