# Plank Timer - Quick Implementation Guide

## Project Setup (5 minutes)

```bash
# Create Next.js project
npx create-next-app@latest plank-timer --typescript --tailwind --app

# Install minimal dependencies
cd plank-timer
npm install date-fns

# Clean up boilerplate
rm -rf app/favicon.ico
rm -rf public/*
```

## Core Implementation Files

### 1. Timer Calculation Utility
```typescript
// utils/timerCalculations.ts
export class PlankTimer {
  static readonly START_DATE = new Date('2024-11-17')
  static readonly BASE_DURATION = 30
  static readonly DAILY_INCREMENT = 6

  static calculateDailyTarget(date: Date = new Date()): number {
    let days = 0
    const current = new Date(this.START_DATE)

    while (current <= date) {
      if (current.getDay() !== 0) days++
      current.setDate(current.getDate() + 1)
    }

    return this.BASE_DURATION + (days * this.DAILY_INCREMENT)
  }
}
```

### 2. Camera Hook
```typescript
// hooks/useCamera.ts
import { useEffect, useRef, useState } from 'react'

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [permission, setPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')

  const requestCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 },
        audio: false
      })
      setStream(mediaStream)
      setPermission('granted')

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      setPermission('denied')
      console.error('Camera access denied:', error)
    }
  }

  const stopCamera = () => {
    stream?.getTracks().forEach(track => track.stop())
    setStream(null)
  }

  useEffect(() => {
    return () => stopCamera()
  }, [stream])

  return { videoRef, stream, permission, requestCamera, stopCamera }
}
```

### 3. Recording Hook with Overlay
```typescript
// hooks/useRecording.ts
import { useRef, useState, useCallback } from 'react'

export function useRecording(stream: MediaStream | null) {
  const [isRecording, setIsRecording] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chunks = useRef<Blob[]>([])

  const startRecording = useCallback((videoElement: HTMLVideoElement, timerCallback: () => string) => {
    if (!stream || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!
    canvas.width = 1280
    canvas.height = 720

    // Render loop for overlay
    let animationId: number
    const renderFrame = () => {
      ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height)

      // Draw timer overlay
      const time = timerCallback()
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      ctx.fillRect(40, 40, 250, 100)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 64px monospace'
      ctx.fillText(time, 60, 110)

      animationId = requestAnimationFrame(renderFrame)
    }
    renderFrame()

    // Start recording canvas stream
    const canvasStream = canvas.captureStream(30)
    const recorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 2500000
    })

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data)
    }

    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: 'video/webm' })
      setVideoBlob(blob)
      chunks.current = []
      cancelAnimationFrame(animationId)
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
  }, [stream])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
  }, [])

  const downloadVideo = useCallback(() => {
    if (!videoBlob) return

    const url = URL.createObjectURL(videoBlob)
    const a = document.createElement('a')
    a.href = url
    a.download = `plank_${Date.now()}.webm`
    a.click()
    URL.revokeObjectURL(url)
  }, [videoBlob])

  return {
    canvasRef,
    isRecording,
    videoBlob,
    startRecording,
    stopRecording,
    downloadVideo
  }
}
```

### 4. Main Timer Component
```typescript
// components/PlankTimerApp.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { useCamera } from '@/hooks/useCamera'
import { useRecording } from '@/hooks/useRecording'
import { PlankTimer } from '@/utils/timerCalculations'

export default function PlankTimerApp() {
  const [timeLeft, setTimeLeft] = useState(0)
  const [isActive, setIsActive] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'prep' | 'plank' | 'complete'>('idle')

  const { videoRef, stream, permission, requestCamera } = useCamera()
  const { canvasRef, isRecording, videoBlob, startRecording, stopRecording, downloadVideo } = useRecording(stream)

  const targetDuration = PlankTimer.calculateDailyTarget()
  const intervalRef = useRef<NodeJS.Timeout>()

  // Timer logic
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(time => {
          if (time <= 1) {
            if (phase === 'prep') {
              setPhase('plank')
              return targetDuration
            } else if (phase === 'plank') {
              setPhase('complete')
              stopRecording()
              setIsActive(false)
              return 0
            }
          }
          return time - 1
        })
      }, 1000)
    } else {
      clearInterval(intervalRef.current)
    }

    return () => clearInterval(intervalRef.current)
  }, [isActive, timeLeft, phase, targetDuration, stopRecording])

  const startSession = async () => {
    if (permission !== 'granted') {
      await requestCamera()
    }

    setPhase('prep')
    setTimeLeft(3)
    setIsActive(true)

    setTimeout(() => {
      if (videoRef.current && stream) {
        startRecording(videoRef.current, () => formatTime(timeLeft))
      }
    }, 100)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8">Plank Timer</h1>

        <div className="text-center mb-4">
          <p className="text-xl">Today's Target: {targetDuration} seconds</p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-lg bg-black"
          />

          <canvas ref={canvasRef} className="hidden" />

          {phase !== 'idle' && (
            <div className="absolute top-8 left-8 bg-black/50 px-6 py-4 rounded-lg">
              <div className="text-5xl font-mono font-bold">
                {formatTime(timeLeft)}
              </div>
              <div className="text-xl mt-2">
                {phase === 'prep' ? 'GET READY' : phase === 'plank' ? 'PLANK' : 'COMPLETE!'}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-center gap-4 mt-8">
          {phase === 'idle' && (
            <button
              onClick={startSession}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-xl font-semibold"
            >
              Start Plank
            </button>
          )}

          {phase === 'complete' && videoBlob && (
            <>
              <button
                onClick={downloadVideo}
                className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg text-xl font-semibold"
              >
                Download Video
              </button>
              <button
                onClick={() => setPhase('idle')}
                className="px-8 py-4 bg-gray-600 hover:bg-gray-700 rounded-lg text-xl font-semibold"
              >
                Try Again
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-8">
          <a
            href={process.env.NEXT_PUBLIC_DISCORD_INVITE_URL || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Join our Discord Community
          </a>
        </div>
      </div>
    </div>
  )
}
```

### 5. Main Page
```typescript
// app/page.tsx
import PlankTimerApp from '@/components/PlankTimerApp'

export default function Home() {
  return <PlankTimerApp />
}
```

### 6. Environment Variables
```bash
# .env.local
NEXT_PUBLIC_DISCORD_INVITE_URL=https://discord.gg/your-invite-code
```

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow prompts, it will auto-detect Next.js
```

## Testing Checklist

- [ ] Camera permission flow works
- [ ] Timer calculates correct daily target
- [ ] Prep countdown works (3 seconds)
- [ ] Main timer counts down properly
- [ ] Video records with overlay
- [ ] Download works correctly
- [ ] Mobile responsive
- [ ] Discord link works
- [ ] Handles camera denial gracefully

## Browser Testing Matrix

Test on:
- Chrome (Desktop & Mobile)
- Safari (macOS & iOS)
- Firefox (Desktop)
- Edge (Desktop)

## Performance Metrics to Monitor

- Initial Load: < 2s
- Time to Interactive: < 3s
- Video file size: ~18MB per minute
- Memory usage: < 200MB during recording