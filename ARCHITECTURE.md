# Plank Timer Web App - Technical Architecture

## Executive Summary
A lightweight, browser-based plank timer application with video recording capabilities, real-time timer overlay, and progressive daily challenges. Built for simplicity, performance, and ease of deployment on Vercel.

---

## 1. Tech Stack Recommendation

### Core Framework
**Next.js 14+ (App Router)**
- **Rationale**:
  - Built-in optimizations for static generation
  - Excellent Vercel integration (same company)
  - React Server Components for optimal initial load
  - Built-in image/font optimization
  - TypeScript support out-of-box

### Build Tools & Configuration
```
- Next.js built-in Webpack/Turbopack
- TypeScript for type safety
- PostCSS with Tailwind CSS for styling
- ESLint + Prettier for code quality
```

### Key Libraries (Minimal Dependencies)
```json
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "date-fns": "^3.0.0"  // For date calculations only
  },
  "devDependencies": {
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
}
```

**Note**: No video processing libraries needed - using native Web APIs

---

## 2. Architecture Overview

### Component Structure
```
src/
├── app/
│   ├── layout.tsx           # Root layout with metadata
│   ├── page.tsx             # Main timer interface
│   └── globals.css          # Tailwind imports
├── components/
│   ├── VideoRecorder/
│   │   ├── CameraFeed.tsx   # Camera stream display
│   │   ├── RecordingControls.tsx
│   │   └── VideoPreview.tsx
│   ├── Timer/
│   │   ├── CountdownDisplay.tsx
│   │   ├── PrepCountdown.tsx
│   │   └── TimerOverlay.tsx
│   ├── UI/
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   └── PermissionPrompt.tsx
│   └── Layout/
│       ├── Header.tsx
│       └── Footer.tsx
├── hooks/
│   ├── useCamera.ts         # Camera access logic
│   ├── useRecording.ts      # Recording state management
│   ├── useTimer.ts          # Timer calculations
│   └── useCountdown.ts      # Countdown logic
├── utils/
│   ├── timerCalculations.ts # Daily target logic
│   ├── videoUtils.ts        # Video processing helpers
│   └── browserCompat.ts     # Feature detection
└── types/
    └── index.ts              # TypeScript definitions
```

### Data Flow Architecture
```
[User Action] → [React Hook] → [Browser API] → [State Update] → [UI Render]
                                      ↓
                              [MediaRecorder]
                                      ↓
                              [Blob Storage]
                                      ↓
                              [Download Link]
```

### State Management
**Local Component State + React Context**
```typescript
// Global App Context
interface AppState {
  isRecording: boolean
  currentTimer: number
  targetDuration: number
  videoBlob: Blob | null
  cameraPermission: 'granted' | 'denied' | 'prompt'
}

// No external state library needed for this scale
```

---

## 3. Video Recording Strategy

### Core Web APIs
```typescript
// Primary APIs
- MediaDevices.getUserMedia() // Camera access
- MediaRecorder API           // Video recording
- Canvas API                  // Timer overlay rendering
- Blob API                    // Video storage
```

### Recording Architecture
```typescript
interface RecordingStrategy {
  // Step 1: Get camera stream
  stream: MediaStream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false  // No audio needed for plank
  })

  // Step 2: Create canvas for overlay
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D

  // Step 3: Composite video + overlay
  canvasStream: MediaStream = canvas.captureStream(30)

  // Step 4: Record composite stream
  recorder: MediaRecorder = new MediaRecorder(canvasStream, {
    mimeType: 'video/webm;codecs=vp9'
  })
}
```

### Timer Overlay Implementation
```typescript
// Real-time Canvas Rendering (30 FPS)
function renderFrame() {
  // Draw video frame
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

  // Draw timer overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
  ctx.fillRect(20, 20, 200, 80)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 48px monospace'
  ctx.fillText(formatTime(remainingTime), 40, 75)

  requestAnimationFrame(renderFrame)
}
```

---

## 4. Timer Logic Design

### Daily Target Calculation
```typescript
class PlankTimer {
  private readonly START_DATE = new Date('2024-11-17')
  private readonly BASE_DURATION = 30 // seconds
  private readonly DAILY_INCREMENT = 6 // seconds

  calculateDailyTarget(currentDate: Date): number {
    // Calculate days elapsed (excluding Sundays)
    const daysSinceStart = this.getPlankDays(this.START_DATE, currentDate)
    return this.BASE_DURATION + (daysSinceStart * this.DAILY_INCREMENT)
  }

  private getPlankDays(start: Date, end: Date): number {
    let count = 0
    const current = new Date(start)

    while (current <= end) {
      if (current.getDay() !== 0) { // Skip Sundays
        count++
      }
      current.setDate(current.getDate() + 1)
    }

    return count
  }

  // Handle prep countdown
  async startPlankSession(): Promise<void> {
    // 3-second prep
    await this.countdown(3, 'GET READY')

    // Main timer
    const target = this.calculateDailyTarget(new Date())
    await this.countdown(target, 'PLANK')
  }
}
```

### State Machine for Timer
```
[IDLE] → [PREP_COUNTDOWN(3s)] → [PLANK_TIMER] → [COMPLETE] → [IDLE]
           ↓                        ↓               ↓
      [CANCELLED]             [CANCELLED]      [SAVE_VIDEO]
```

---

## 5. Storage Strategy

### Video Storage Approach
**In-Memory Blob + Direct Download**

```typescript
interface StorageStrategy {
  // Option 1: Memory-only (Recommended for MVP)
  approach: 'blob-url'
  pros: ['Simple', 'No storage limits', 'Fast']
  cons: ['Lost on refresh', 'Limited to session']

  implementation: {
    // Store in component state
    videoBlob: Blob
    downloadUrl: URL.createObjectURL(videoBlob)

    // Cleanup
    cleanup: () => URL.revokeObjectURL(downloadUrl)
  }
}

// Optional: IndexedDB for persistence
interface PersistentStorage {
  approach: 'indexeddb'
  maxVideos: 5
  autoDelete: 'after-7-days'

  implementation: {
    store: async (blob: Blob) => {
      const db = await openDB('plank-videos', 1)
      await db.put('videos', {
        id: Date.now(),
        blob,
        date: new Date(),
        duration: targetDuration
      })
    }
  }
}
```

### Download Implementation
```typescript
function downloadVideo(blob: Blob, duration: number) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `plank_${duration}s_${Date.now()}.webm`
  a.click()
  URL.revokeObjectURL(url)
}
```

---

## 6. Deployment Architecture

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "next build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "regions": ["iad1"], // US East for initial deployment
  "functions": {
    "app/page.tsx": {
      "maxDuration": 10
    }
  }
}
```

### Build Strategy
**Static Generation with Client-Side Hydration**
```typescript
// app/page.tsx
export default function Home() {
  // Static shell
  return (
    <main>
      <PlankTimerApp /> {/* Client Component */}
    </main>
  )
}

// components/PlankTimerApp.tsx
'use client'
export default function PlankTimerApp() {
  // All interactive logic here
}
```

### Environment Variables
```bash
# .env.local
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/your-invite
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX # Optional analytics
```

---

## 7. Performance Considerations

### Video Encoding Optimization
```typescript
const recordingOptions = {
  // Balance quality vs file size
  videoBitsPerSecond: 2500000, // 2.5 Mbps
  mimeType: 'video/webm;codecs=vp9', // Better compression

  // Fallback chain
  fallbackMimeTypes: [
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4' // Safari fallback
  ]
}

// Estimated file sizes (per minute)
// 720p @ 2.5Mbps ≈ 18.75 MB/min
// 1080p @ 4Mbps ≈ 30 MB/min
```

### Performance Optimizations
```typescript
interface PerformanceStrategy {
  // 1. Lazy load video components
  VideoRecorder: dynamic(() => import('./VideoRecorder'), {
    loading: () => <Skeleton />
  })

  // 2. Optimize canvas rendering
  canvasOptimizations: {
    willReadFrequently: false,
    desynchronized: true,
    fps: 30 // Cap at 30fps for battery life
  }

  // 3. Memory management
  cleanup: {
    revokeObjectURLs: true,
    stopMediaStreams: true,
    clearCanvasContext: true
  }

  // 4. Web Workers for heavy computation (future)
  offloadProcessing: 'SharedArrayBuffer'
}
```

### Bundle Size Management
```
Target Bundle Sizes:
- First Load JS: < 85kB
- Page Weight: < 150kB
- Time to Interactive: < 2s

Achieved via:
- No heavy dependencies
- Dynamic imports
- Next.js automatic code splitting
```

---

## 8. Browser Compatibility

### Required APIs & Support Matrix
```typescript
interface BrowserRequirements {
  critical: {
    'MediaDevices.getUserMedia': 'Chrome 53+, Firefox 36+, Safari 11+',
    'MediaRecorder': 'Chrome 47+, Firefox 25+, Safari 14.1+',
    'Canvas.captureStream': 'Chrome 51+, Firefox 43+, Safari 15+'
  },

  optional: {
    'Screen Wake Lock': 'Chrome 84+, Edge 84+', // Keep screen on
    'Fullscreen API': 'All modern browsers'
  }
}
```

### Feature Detection & Fallbacks
```typescript
class CompatibilityChecker {
  async checkSupport(): Promise<CompatReport> {
    const report = {
      camera: 'mediaDevices' in navigator,
      recording: typeof MediaRecorder !== 'undefined',
      canvas: 'captureStream' in HTMLCanvasElement.prototype,

      // Check codec support
      codecs: await this.checkCodecSupport()
    }

    if (!report.camera || !report.recording) {
      return {
        supported: false,
        message: 'Your browser doesn't support video recording',
        suggestion: 'Please use Chrome, Firefox, or Safari 14.1+'
      }
    }

    return { supported: true }
  }

  private async checkCodecSupport() {
    const types = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/mp4'
    ]

    return types.filter(type =>
      MediaRecorder.isTypeSupported(type)
    )
  }
}
```

### Mobile-Specific Considerations
```typescript
interface MobileOptimizations {
  // Request mobile-optimized camera
  cameraConstraints: {
    facingMode: 'user',
    width: { ideal: 720 }, // Lower res for mobile
    height: { ideal: 1280 }
  },

  // Touch-friendly UI
  buttonSizes: 'min-h-[44px]', // iOS touch target

  // Battery optimization
  reducedFrameRate: 24, // vs 30 on desktop

  // Prevent sleep during recording
  wakeLock: navigator.wakeLock?.request('screen')
}
```

---

## 9. Security Considerations

### Permission Handling
```typescript
class PermissionManager {
  async requestCameraAccess(): Promise<PermissionState> {
    try {
      // Check existing permission
      const result = await navigator.permissions.query({
        name: 'camera' as PermissionName
      })

      if (result.state === 'prompt') {
        // Show custom UI explaining why we need camera
        await this.showPermissionExplainer()
      }

      // Request access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true
      })

      // Important: Stop tracks after check
      stream.getTracks().forEach(track => track.stop())

      return 'granted'
    } catch (error) {
      return 'denied'
    }
  }
}
```

### Content Security Policy
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      media-src 'self' blob:;
      connect-src 'self';
    `.replace(/\n/g, '')
  }
]
```

---

## 10. Implementation Roadmap

### Phase 1: MVP (Week 1)
- [ ] Basic Next.js setup with TypeScript
- [ ] Camera access and video display
- [ ] Timer logic with daily calculations
- [ ] Simple recording without overlay
- [ ] Download functionality

### Phase 2: Core Features (Week 2)
- [ ] Canvas-based timer overlay
- [ ] Prep countdown implementation
- [ ] Mobile responsive design
- [ ] Discord link integration
- [ ] Deploy to Vercel

### Phase 3: Polish (Week 3)
- [ ] Performance optimizations
- [ ] Browser compatibility fixes
- [ ] Error handling and edge cases
- [ ] UI/UX improvements
- [ ] Testing on multiple devices

### Phase 4: Future Enhancements
- [ ] AI pose detection integration
- [ ] Video history (IndexedDB)
- [ ] Share to social media
- [ ] Progress tracking
- [ ] Achievements/gamification

---

## 11. Testing Strategy

### Unit Tests
```typescript
// Timer calculation tests
describe('PlankTimer', () => {
  it('calculates correct duration for day 1', () => {
    expect(timer.calculateDailyTarget(START_DATE)).toBe(30)
  })

  it('skips Sundays correctly', () => {
    // Test Sunday logic
  })
})
```

### E2E Testing Scenarios
1. Camera permission flow
2. Complete recording session
3. Video download
4. Mobile browser testing
5. Network interruption handling

---

## 12. Monitoring & Analytics

### Client-Side Monitoring
```typescript
interface Analytics {
  events: [
    'session_start',
    'camera_permission_granted',
    'recording_started',
    'recording_completed',
    'video_downloaded',
    'error_occurred'
  ],

  metrics: {
    recordingDuration: number,
    targetDuration: number,
    completionRate: number
  }
}
```

---

## Conclusion

This architecture provides a solid foundation for a performant, user-friendly plank timer application. The design prioritizes:
- **Simplicity**: Minimal dependencies, straightforward data flow
- **Performance**: Optimized video handling, efficient rendering
- **Scalability**: Clear separation of concerns, ready for future features
- **User Experience**: Fast load times, responsive design, offline-capable

The modular structure allows for easy maintenance and feature additions while keeping the core application lightweight and focused on its primary purpose.