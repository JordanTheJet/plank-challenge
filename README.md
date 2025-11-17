# Plank Timer

A web app for recording plank exercises with a timer overlay, designed for progressive daily challenges.

## Features

- **Progressive Challenge**: Starting Nov 17, 2025, begin with 30 seconds on Day 1, adding 6 seconds each day
- **Rest Days**: Every Sunday is automatically a rest day
- **Video Recording**: Records your plank with timer overlay using canvas compositing
- **Timer Overlay**: Large, visible stopwatch-style timer rendered directly into the video
- **Front-Facing Camera**: Uses selfie camera so you can see yourself while recording
- **Transparent Countdown**: See yourself during the 3-2-1 countdown to get positioned
- **Stop Button**: Stop recording early and choose to download or try again
- **Manual Download**: Choose to download video, screenshot, or record another
- **Screenshot Export**: Capture final frame as PNG with timer visible
- **Mobile-First**: Optimized for iOS Safari and Chrome Android
- **Discord Integration**: Easy access to Plank-Challenge Discord community

## Tech Stack

- **Framework**: Next.js 16 with TypeScript
- **Styling**: Tailwind CSS
- **Video Recording**: MediaRecorder API with Canvas compositing
- **Date Calculations**: date-fns
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd Plank-timer
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Vercel will auto-detect Next.js and deploy
4. (Optional) Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_DISCORD_URL`: Your Discord channel URL

Or use Vercel CLI:
```bash
npm i -g vercel
vercel
```

## How It Works

### Timer Calculation

The app calculates daily targets based on:
- **Start Date**: November 17, 2025
- **Base Duration**: 30 seconds
- **Daily Increment**: 6 seconds per training day
- **Rest Days**: All Sundays are skipped

Formula: `Target = 30 + (Training Days × 6)`

### Video Recording

1. Requests front-facing camera access (selfie mode)
2. Shows transparent 3-second countdown over live video feed
3. Streams video to hidden `<video>` element
4. Renders video + timer overlay on `<canvas>` at 30 FPS
5. Captures canvas stream with MediaRecorder API
6. Stop button allows ending recording early
7. Preview screen shows options to download video, screenshot, or record another

### File Naming

Videos are saved as: `plank-dayX-YYYY-MM-DD.webm`
Screenshots are saved as: `plank-dayX-YYYYMMDD-screenshot.png`

Examples:
- `plank-day5-2025-11-22.webm`
- `plank-day5-20251122-screenshot.png`

## Browser Compatibility

- ✅ Chrome 90+
- ✅ Safari 14+ (iOS and macOS)
- ✅ Edge 90+
- ✅ Firefox 90+

**Note**: MediaRecorder API support required. Most modern browsers supported.

## Project Structure

```
/Users/jordantian/Documents/Plank-timer/
├── app/
│   ├── page.tsx           # Main page
│   ├── layout.tsx         # Root layout with metadata
│   └── globals.css        # Global styles
├── components/
│   ├── PlankTimer.tsx     # Main timer component
│   ├── VideoRecorder.tsx  # Video recording with canvas overlay
│   └── RestDay.tsx        # Sunday rest day display
├── utils/
│   ├── timerLogic.ts      # Date and timer calculations
│   └── videoRecorder.ts   # MediaRecorder wrapper
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── vercel.json            # Vercel deployment config
```

## Key Components

### PlankTimer
Main component managing app state (idle, recording, completed) and rendering appropriate views.

### VideoRecorder
Handles camera access, canvas rendering, timer overlay composition, and video recording.

### RestDay
Displays rest day message on Sundays with next challenge information.

### timerLogic.ts
Utility functions for:
- Calculating target duration based on date
- Counting Sundays between dates
- Getting day numbers
- Finding next training day
- Formatting durations

### videoRecorder.ts
Utility classes for:
- MediaRecorder setup and management
- Camera stream acquisition
- Video blob download

## Configuration

### Environment Variables

- `NEXT_PUBLIC_DISCORD_URL`: Discord channel URL (optional, has default)

### Timer Settings

Edit in `/Users/jordantian/Documents/Plank-timer/utils/timerLogic.ts`:
- `START_DATE`: Challenge start date
- `BASE_DURATION`: Starting duration in seconds
- `DAILY_INCREMENT`: Seconds added per day

## Troubleshooting

### Camera Access Denied
- Check browser permissions
- Ensure HTTPS or localhost
- Try different browser

### Video Not Recording
- Check MediaRecorder browser support
- Verify camera is not in use by another app
- Check console for errors

### Video Not Downloading
- Check browser download permissions
- Verify pop-up blocker settings
- Try different browser

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a PR.

## Support

Join our Discord community: [Plank Timer Discord](https://discord.com/channels/1210290974601773056/1438326766279196782)
