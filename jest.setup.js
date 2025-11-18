// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock MediaPipe
global.FilesetResolver = {
  forVisionTasks: jest.fn(),
}

global.PoseLandmarker = {
  createFromOptions: jest.fn(),
}

// Mock MediaRecorder
class MediaRecorderMock {
  constructor(stream, options) {
    this.state = 'inactive'
    this.ondataavailable = null
    this.onstop = null
    this.onerror = null
    this.onstart = null
    this.onpause = null
    this.onresume = null
    this.stream = stream
    this.mimeType = options?.mimeType || 'video/webm'
  }

  start(timeslice) {
    this.state = 'recording'
    if (this.onstart) {
      this.onstart()
    }
    // Emit dataavailable event periodically if timeslice is set
    if (timeslice) {
      this.timesliceInterval = setInterval(() => {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['mock-data'], { type: this.mimeType }) })
        }
      }, timeslice)
    }
  }

  stop() {
    if (this.timesliceInterval) {
      clearInterval(this.timesliceInterval)
    }
    this.state = 'inactive'
    // Emit final dataavailable event
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['mock-data'], { type: this.mimeType }) })
    }
    if (this.onstop) {
      this.onstop()
    }
  }

  pause() {
    this.state = 'paused'
    if (this.onpause) {
      this.onpause()
    }
  }

  resume() {
    this.state = 'recording'
    if (this.onresume) {
      this.onresume()
    }
  }

  requestData() {
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob(['mock-data'], { type: this.mimeType }) })
    }
  }

  static isTypeSupported(type) {
    return true
  }
}

global.MediaRecorder = MediaRecorderMock

// Mock getUserMedia
global.navigator.mediaDevices = {
  getUserMedia: jest.fn(() =>
    Promise.resolve({
      getTracks: () => [
        { stop: jest.fn(), kind: 'video' }
      ],
    })
  ),
}

// Mock canvas methods
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillStyle: '',
  strokeStyle: '',
  lineWidth: 0,
  font: '',
  textAlign: 'left',
  textBaseline: 'top',
  clearRect: jest.fn(),
  fillRect: jest.fn(),
  strokeRect: jest.fn(),
  fillText: jest.fn(),
  strokeText: jest.fn(),
  measureText: jest.fn(() => ({ width: 100 })),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  arc: jest.fn(),
  stroke: jest.fn(),
  fill: jest.fn(),
  closePath: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  translate: jest.fn(),
}))

HTMLCanvasElement.prototype.toDataURL = jest.fn(() => 'data:image/png;base64,mock')
HTMLCanvasElement.prototype.captureStream = jest.fn(() => ({
  getTracks: () => [{ stop: jest.fn() }],
}))

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = jest.fn()

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => {
  cb(0)
  return 0
})

global.cancelAnimationFrame = jest.fn()

// Mock performance.now
global.performance.now = jest.fn(() => Date.now())

// Suppress console errors during tests (optional, useful for cleaner test output)
const originalError = console.error
beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Only suppress specific expected errors
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Not implemented: HTMLFormElement.prototype.submit') ||
       args[0].includes('Not implemented: HTMLCanvasElement.prototype.getContext'))
    ) {
      return
    }
    originalError.call(console, ...args)
  })
})

afterAll(() => {
  console.error = originalError
})
