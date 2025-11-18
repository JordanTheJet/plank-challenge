/**
 * Dynamic MediaPipe Loader
 * Lazy loads MediaPipe library only when pose detection is needed
 * This reduces initial bundle size and improves initial page load performance
 */

import type { PoseLandmarker, FilesetResolver as FilesetResolverType } from '@mediapipe/tasks-vision';

// Cache the loaded instances to avoid re-loading
let poseLandmarkerInstance: PoseLandmarker | null = null;
let isLoading = false;
let loadPromise: Promise<PoseLandmarker> | null = null;

/**
 * Dynamically import MediaPipe and initialize PoseLandmarker
 * Returns cached instance if already loaded
 */
export async function loadPoseLandmarker(): Promise<PoseLandmarker> {
  // Return cached instance if already loaded
  if (poseLandmarkerInstance) {
    return poseLandmarkerInstance;
  }

  // Return existing promise if already loading (prevent duplicate loads)
  if (isLoading && loadPromise) {
    return loadPromise;
  }

  // Start loading
  isLoading = true;
  loadPromise = (async () => {
    try {
      // Dynamic import - code split MediaPipe into separate chunk
      const { PoseLandmarker, FilesetResolver } = await import(
        /* webpackChunkName: "mediapipe" */
        '@mediapipe/tasks-vision'
      );

      // Load MediaPipe Vision tasks from CDN (not bundled)
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Create PoseLandmarker with optimized settings for mobile performance
      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          // Use lite model for better mobile performance
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU', // Use GPU acceleration when available
        },
        runningMode: 'VIDEO',
        numPoses: 1, // Only detect one person for better performance
        minPoseDetectionConfidence: 0.3,
        minPosePresenceConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });

      // Cache the instance
      poseLandmarkerInstance = poseLandmarker;
      isLoading = false;

      return poseLandmarker;
    } catch (error) {
      isLoading = false;
      loadPromise = null;
      throw new Error('Failed to load MediaPipe: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  })();

  return loadPromise;
}

/**
 * Cleanup and reset the MediaPipe instance
 * Call this when no longer needed to free up resources
 */
export function cleanupPoseLandmarker(): void {
  if (poseLandmarkerInstance) {
    try {
      poseLandmarkerInstance.close();
    } catch (err) {
      console.warn('Error closing pose landmarker:', err);
    }
    poseLandmarkerInstance = null;
  }
  isLoading = false;
  loadPromise = null;
}

/**
 * Check if MediaPipe is currently loaded
 */
export function isPoseLandmarkerLoaded(): boolean {
  return poseLandmarkerInstance !== null;
}

/**
 * Preload MediaPipe in the background (use during idle time)
 * This can be called proactively to improve UX when user is likely to use detection
 */
export function preloadPoseLandmarker(): void {
  if (!poseLandmarkerInstance && !isLoading) {
    // Use requestIdleCallback for non-blocking preload
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        loadPoseLandmarker().catch(err => {
          console.warn('Preload failed:', err);
        });
      }, { timeout: 2000 });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        loadPoseLandmarker().catch(err => {
          console.warn('Preload failed:', err);
        });
      }, 100);
    }
  }
}
