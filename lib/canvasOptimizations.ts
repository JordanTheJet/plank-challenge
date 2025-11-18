/**
 * Canvas Optimization Utilities
 * Performance-critical functions for canvas rendering
 */

/**
 * Create optimized canvas context with performance settings
 * @param canvas Canvas element
 * @param options Context options
 */
export function getOptimizedCanvasContext(
  canvas: HTMLCanvasElement,
  options: {
    alpha?: boolean;
    desynchronized?: boolean;
    willReadFrequently?: boolean;
  } = {}
): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext('2d', {
    alpha: options.alpha ?? false, // Disable alpha for better performance
    desynchronized: options.desynchronized ?? true, // Enable for lower latency
    willReadFrequently: options.willReadFrequently ?? false,
  });

  if (!ctx) return null;

  // Set image smoothing for better quality/performance balance
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'low'; // Use 'low' for better performance on mobile

  return ctx;
}

/**
 * Efficiently clear canvas using fillRect (faster than clearRect in some cases)
 * @param ctx Canvas context
 * @param width Canvas width
 * @param height Canvas height
 */
export function fastClearCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): void {
  // Save current composite operation
  const prevOperation = ctx.globalCompositeOperation;

  // Use 'copy' operation for fastest clear
  ctx.globalCompositeOperation = 'copy';
  ctx.fillStyle = 'transparent';
  ctx.fillRect(0, 0, width, height);

  // Restore previous operation
  ctx.globalCompositeOperation = prevOperation;
}

/**
 * Batch canvas operations for better performance
 * Groups multiple canvas operations to minimize state changes
 */
export class CanvasBatchRenderer {
  private ctx: CanvasRenderingContext2D;
  private operations: Array<() => void> = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Add operation to batch
   */
  add(operation: () => void): void {
    this.operations.push(operation);
  }

  /**
   * Execute all batched operations
   */
  flush(): void {
    this.ctx.save();

    for (const operation of this.operations) {
      operation();
    }

    this.ctx.restore();
    this.operations = [];
  }

  /**
   * Clear batch without executing
   */
  clear(): void {
    this.operations = [];
  }
}

/**
 * Throttle function for performance-critical operations
 * Uses requestAnimationFrame for smooth animations
 */
export function throttleRAF<T extends (...args: any[]) => void>(
  callback: T
): (...args: Parameters<T>) => void {
  let rafId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return (...args: Parameters<T>) => {
    lastArgs = args;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastArgs) {
          callback(...lastArgs);
        }
        rafId = null;
        lastArgs = null;
      });
    }
  };
}

/**
 * Create offscreen canvas for pre-rendering static content
 * Useful for backgrounds or overlays that don't change frequently
 */
export function createOffscreenCanvas(
  width: number,
  height: number
): { canvas: HTMLCanvasElement | OffscreenCanvas; ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D } {
  // Use OffscreenCanvas if available (better performance)
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Failed to get offscreen context');
    return { canvas, ctx };
  }

  // Fallback to regular canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Failed to get canvas context');
  return { canvas, ctx };
}

/**
 * Optimized text rendering with caching
 * Measures text once and caches the result
 */
export class CachedTextRenderer {
  private measureCache = new Map<string, TextMetrics>();
  private ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  /**
   * Measure text with caching
   */
  measureText(text: string, font: string): TextMetrics {
    const cacheKey = `${font}:${text}`;

    if (this.measureCache.has(cacheKey)) {
      return this.measureCache.get(cacheKey)!;
    }

    this.ctx.font = font;
    const metrics = this.ctx.measureText(text);
    this.measureCache.set(cacheKey, metrics);

    // Limit cache size to prevent memory leaks
    if (this.measureCache.size > 100) {
      const firstKey = this.measureCache.keys().next().value;
      if (firstKey) {
        this.measureCache.delete(firstKey);
      }
    }

    return metrics;
  }

  /**
   * Render text with pre-measured metrics
   */
  renderText(
    text: string,
    x: number,
    y: number,
    font: string,
    fillStyle: string
  ): void {
    this.ctx.font = font;
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Clear measurement cache
   */
  clearCache(): void {
    this.measureCache.clear();
  }
}

/**
 * Performance monitoring for canvas operations
 */
export class CanvasPerformanceMonitor {
  private frameCount = 0;
  private lastTime = performance.now();
  private fps = 0;
  private frameTime = 0;
  private samples: number[] = [];
  private maxSamples = 60;

  /**
   * Call this at the start of each frame
   */
  startFrame(): number {
    return performance.now();
  }

  /**
   * Call this at the end of each frame
   */
  endFrame(startTime: number): void {
    const now = performance.now();
    const frameTime = now - startTime;

    this.frameTime = frameTime;
    this.samples.push(frameTime);

    if (this.samples.length > this.maxSamples) {
      this.samples.shift();
    }

    this.frameCount++;

    // Update FPS every second
    if (now - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = now;
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps;
  }

  /**
   * Get current frame time in ms
   */
  getFrameTime(): number {
    return this.frameTime;
  }

  /**
   * Get average frame time over recent samples
   */
  getAverageFrameTime(): number {
    if (this.samples.length === 0) return 0;
    const sum = this.samples.reduce((a, b) => a + b, 0);
    return sum / this.samples.length;
  }

  /**
   * Check if performance is good (> 30 FPS)
   */
  isPerformanceGood(): boolean {
    return this.fps >= 30 && this.getAverageFrameTime() < 33; // 33ms = 30 FPS
  }

  /**
   * Get performance stats for debugging
   */
  getStats(): {
    fps: number;
    frameTime: number;
    avgFrameTime: number;
    isGood: boolean;
  } {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      avgFrameTime: this.getAverageFrameTime(),
      isGood: this.isPerformanceGood(),
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.fps = 0;
    this.frameTime = 0;
    this.samples = [];
  }
}
