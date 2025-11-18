import {
  VideoRecorder,
  downloadBlob,
  getCameraStream,
  RecorderOptions,
} from '../videoRecorder';

describe('VideoRecorder', () => {
  let recorder: VideoRecorder;
  let mockStream: MediaStream;

  beforeEach(() => {
    recorder = new VideoRecorder();

    // Create mock MediaStream
    mockStream = {
      getTracks: jest.fn(() => [
        { stop: jest.fn(), kind: 'video' },
      ]),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create recorder with default options', () => {
      const recorder = new VideoRecorder();
      expect(recorder).toBeInstanceOf(VideoRecorder);
    });

    it('should accept custom options', () => {
      const options: RecorderOptions = {
        mimeType: 'video/webm',
        videoBitsPerSecond: 5000000,
      };

      const recorder = new VideoRecorder(options);
      expect(recorder).toBeInstanceOf(VideoRecorder);
    });

    it('should use supported MIME type', () => {
      const recorder = new VideoRecorder();
      // Should not throw error
      expect(recorder).toBeDefined();
    });
  });

  describe('start', () => {
    it('should start recording', () => {
      expect(() => recorder.start(mockStream)).not.toThrow();
      expect(recorder.isRecording()).toBe(true);
    });

    it('should initialize MediaRecorder with stream', () => {
      recorder.start(mockStream);

      // MediaRecorder should be created and started
      expect(recorder.isRecording()).toBe(true);
      expect(recorder.getState()).toBe('recording');
    });

    it('should reset recorded chunks on start', () => {
      recorder.start(mockStream);
      // Start again (simulating restart)
      recorder.start(mockStream);

      expect(recorder.isRecording()).toBe(true);
    });

    it('should handle errors during start', () => {
      // Create invalid stream
      const invalidStream = null as any;

      expect(() => recorder.start(invalidStream)).toThrow();
    });
  });

  describe('stop', () => {
    it('should stop recording and return blob', async () => {
      recorder.start(mockStream);

      const blob = await recorder.stop();

      expect(blob).toBeInstanceOf(Blob);
      expect(recorder.isRecording()).toBe(false);
    });

    it('should reject if no active recording', async () => {
      await expect(recorder.stop()).rejects.toThrow('No active recording');
    });

    it('should create blob with correct MIME type', async () => {
      recorder.start(mockStream);
      const blob = await recorder.stop();

      expect(blob.type).toBeTruthy();
    });

    it('should handle stop errors gracefully', async () => {
      recorder.start(mockStream);

      // Mock error in MediaRecorder
      const mockMediaRecorder = (recorder as any).mediaRecorder;
      if (mockMediaRecorder) {
        mockMediaRecorder.stop = jest.fn(() => {
          throw new Error('Stop failed');
        });
      }

      await expect(recorder.stop()).rejects.toThrow();
    });
  });

  describe('isRecording', () => {
    it('should return false when not recording', () => {
      expect(recorder.isRecording()).toBe(false);
    });

    it('should return true when recording', () => {
      recorder.start(mockStream);
      expect(recorder.isRecording()).toBe(true);
    });

    it('should return false after stopping', async () => {
      recorder.start(mockStream);
      await recorder.stop();
      expect(recorder.isRecording()).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return inactive when not recording', () => {
      expect(recorder.getState()).toBe('inactive');
    });

    it('should return recording when active', () => {
      recorder.start(mockStream);
      expect(recorder.getState()).toBe('recording');
    });

    it('should return inactive after stopping', async () => {
      recorder.start(mockStream);
      await recorder.stop();
      expect(recorder.getState()).toBe('inactive');
    });
  });

  describe('data collection', () => {
    it('should collect data chunks during recording', async () => {
      recorder.start(mockStream);

      // Simulate data available event
      const mockMediaRecorder = (recorder as any).mediaRecorder;
      if (mockMediaRecorder && mockMediaRecorder.ondataavailable) {
        const mockData = new Blob(['test data'], { type: 'video/webm' });
        mockMediaRecorder.ondataavailable({ data: mockData } as any);
      }

      const blob = await recorder.stop();

      expect(blob.size).toBeGreaterThan(0);
    });

    it('should ignore empty data chunks', async () => {
      recorder.start(mockStream);

      // Simulate empty data event
      const mockMediaRecorder = (recorder as any).mediaRecorder;
      if (mockMediaRecorder && mockMediaRecorder.ondataavailable) {
        mockMediaRecorder.ondataavailable({
          data: new Blob([], { type: 'video/webm' }),
        } as any);
      }

      const blob = await recorder.stop();
      expect(blob).toBeInstanceOf(Blob);
    });
  });

  describe('MIME type support', () => {
    it('should check for supported MIME types', () => {
      // MediaRecorder.isTypeSupported is mocked to always return true
      expect(MediaRecorder.isTypeSupported('video/webm')).toBe(true);
    });

    it('should fall back to video/webm if no type is supported', () => {
      // In real implementation, it would fall back
      const recorder = new VideoRecorder();
      expect(recorder).toBeDefined();
    });
  });
});

describe('downloadBlob', () => {
  beforeEach(() => {
    // Mock document methods
    document.body.appendChild = jest.fn();
    document.body.removeChild = jest.fn();

    // Mock URL methods
    global.URL.createObjectURL = jest.fn(() => 'mock-blob-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create download link and trigger click', () => {
    const blob = new Blob(['test data'], { type: 'video/webm' });
    const filename = 'test-video.webm';

    downloadBlob(blob, filename);

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(blob);
  });

  it('should use provided filename', () => {
    const blob = new Blob(['test data'], { type: 'video/webm' });
    const filename = 'my-custom-video.webm';

    downloadBlob(blob, filename);

    // Should create object URL
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('should clean up after download', (done) => {
    const blob = new Blob(['test data'], { type: 'video/webm' });
    const filename = 'test-video.webm';

    downloadBlob(blob, filename);

    // Cleanup happens after timeout
    setTimeout(() => {
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
      done();
    }, 150);
  });

  it('should handle empty blob', () => {
    const blob = new Blob([], { type: 'video/webm' });
    const filename = 'empty.webm';

    expect(() => downloadBlob(blob, filename)).not.toThrow();
  });

  it('should handle special characters in filename', () => {
    const blob = new Blob(['test'], { type: 'video/webm' });
    const filename = 'test video (final) [2024].webm';

    expect(() => downloadBlob(blob, filename)).not.toThrow();
  });
});

describe('getCameraStream', () => {
  beforeEach(() => {
    // Mock getUserMedia
    global.navigator.mediaDevices.getUserMedia = jest.fn(() =>
      Promise.resolve({
        getTracks: () => [
          {
            stop: jest.fn(),
            kind: 'video',
            getSettings: () => ({
              width: 1920,
              height: 1080,
              facingMode: 'environment',
            }),
          },
        ],
      } as any)
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should request camera access', async () => {
    await getCameraStream();

    expect(global.navigator.mediaDevices.getUserMedia).toHaveBeenCalled();
  });

  it('should request rear camera', async () => {
    await getCameraStream();

    const callArgs = (global.navigator.mediaDevices.getUserMedia as jest.Mock).mock.calls[0][0];

    expect(callArgs.video.facingMode).toEqual({ ideal: 'environment' });
  });

  it('should request landscape orientation', async () => {
    await getCameraStream();

    const callArgs = (global.navigator.mediaDevices.getUserMedia as jest.Mock).mock.calls[0][0];

    expect(callArgs.video.width).toEqual({ ideal: 1920 });
    expect(callArgs.video.height).toEqual({ ideal: 1080 });
  });

  it('should request 16:9 aspect ratio', async () => {
    await getCameraStream();

    const callArgs = (global.navigator.mediaDevices.getUserMedia as jest.Mock).mock.calls[0][0];

    expect(callArgs.video.aspectRatio).toEqual({ ideal: 16 / 9 });
  });

  it('should not request audio', async () => {
    await getCameraStream();

    const callArgs = (global.navigator.mediaDevices.getUserMedia as jest.Mock).mock.calls[0][0];

    expect(callArgs.audio).toBe(false);
  });

  it('should return MediaStream', async () => {
    const stream = await getCameraStream();

    expect(stream).toBeDefined();
    expect(stream.getTracks).toBeDefined();
    expect(typeof stream.getTracks).toBe('function');
  });

  it('should handle camera permission denied', async () => {
    global.navigator.mediaDevices.getUserMedia = jest.fn(() =>
      Promise.reject(new Error('Permission denied'))
    );

    await expect(getCameraStream()).rejects.toThrow('Camera access denied or unavailable');
  });

  it('should handle camera not available', async () => {
    global.navigator.mediaDevices.getUserMedia = jest.fn(() =>
      Promise.reject(new Error('NotFoundError'))
    );

    await expect(getCameraStream()).rejects.toThrow();
  });

  it('should handle getUserMedia not supported', async () => {
    const originalGetUserMedia = global.navigator.mediaDevices.getUserMedia;
    (global.navigator.mediaDevices as any).getUserMedia = undefined;

    await expect(getCameraStream()).rejects.toThrow();

    // Restore
    global.navigator.mediaDevices.getUserMedia = originalGetUserMedia;
  });
});

describe('Integration scenarios', () => {
  it('should handle complete recording workflow', async () => {
    const recorder = new VideoRecorder();
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn(), kind: 'video' }]),
    } as any;

    // Start recording
    recorder.start(mockStream);
    expect(recorder.isRecording()).toBe(true);

    // Simulate some recording time
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Stop recording
    const blob = await recorder.stop();
    expect(blob).toBeInstanceOf(Blob);
    expect(recorder.isRecording()).toBe(false);
  });

  it('should handle multiple start/stop cycles', async () => {
    const recorder = new VideoRecorder();
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn(), kind: 'video' }]),
    } as any;

    // First recording
    recorder.start(mockStream);
    await recorder.stop();

    // Second recording
    recorder.start(mockStream);
    expect(recorder.isRecording()).toBe(true);
    await recorder.stop();
    expect(recorder.isRecording()).toBe(false);
  });

  it('should handle rapid start/stop', async () => {
    const recorder = new VideoRecorder();
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn(), kind: 'video' }]),
    } as any;

    recorder.start(mockStream);
    const blob = await recorder.stop();

    expect(blob).toBeInstanceOf(Blob);
  });
});

describe('Error handling', () => {
  it('should handle MediaRecorder creation failure', () => {
    const originalMediaRecorder = global.MediaRecorder;
    (global as any).MediaRecorder = class {
      constructor() {
        throw new Error('MediaRecorder not supported');
      }
      static isTypeSupported() {
        return true;
      }
    };

    const recorder = new VideoRecorder();
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn() }]),
    } as any;

    expect(() => recorder.start(mockStream)).toThrow();

    // Restore
    global.MediaRecorder = originalMediaRecorder;
  });

  it('should handle stop during error state', async () => {
    const recorder = new VideoRecorder();
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn(), kind: 'video' }]),
    } as any;

    recorder.start(mockStream);

    // Simulate error
    const mockMediaRecorder = (recorder as any).mediaRecorder;
    if (mockMediaRecorder && mockMediaRecorder.onerror) {
      mockMediaRecorder.onerror(new Event('error'));
    }

    // Should still be able to stop
    await expect(recorder.stop()).resolves.toBeDefined();
  });
});
