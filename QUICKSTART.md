# Quick Start Guide

## Run Locally

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deploy to Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. Push your code to GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. Go to [vercel.com](https://vercel.com)
3. Click "Add New Project"
4. Import your GitHub repository
5. Vercel will auto-detect Next.js and configure everything
6. Click "Deploy"

### Option 2: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to deploy

## Environment Variables (Optional)

If you want to customize the Discord URL, create a `.env.local` file:

```bash
NEXT_PUBLIC_DISCORD_URL=your-custom-discord-url
```

Or set it in Vercel Dashboard:
1. Go to Project Settings
2. Navigate to Environment Variables
3. Add `NEXT_PUBLIC_DISCORD_URL` with your value

## Testing the App

### Test on Desktop
1. Open the app in Chrome or Firefox
2. Grant camera permissions when prompted
3. Click "Start Recording"
4. Hold plank position until timer completes
5. Video should auto-download

### Test on Mobile
1. Open the app in Safari (iOS) or Chrome (Android)
2. Grant camera permissions
3. The rear camera should be used by default
4. Complete the recording
5. Check your Downloads folder for the video

### Test Rest Day (Sunday)
The app will automatically show the rest day screen on Sundays. To test:
1. Temporarily modify the date in your system
2. Or check the logic in `/Users/jordantian/Documents/Plank-timer/utils/timerLogic.ts`

## Troubleshooting

### Camera not working
- Ensure you're using HTTPS or localhost
- Check browser permissions
- Try a different browser
- Verify camera is not in use by another app

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Tailwind styles not working
```bash
# Ensure @tailwindcss/postcss is installed
npm install @tailwindcss/postcss --save-dev
```

## Project Structure

Key files you might want to customize:

- `/Users/jordantian/Documents/Plank-timer/utils/timerLogic.ts` - Timer calculation logic
  - Change `START_DATE` to set a different start date
  - Change `BASE_DURATION` for different starting duration
  - Change `DAILY_INCREMENT` to adjust progression rate

- `/Users/jordantian/Documents/Plank-timer/components/VideoRecorder.tsx` - Video recording
  - Adjust timer overlay appearance (line 149-164)
  - Change video quality settings

- `/Users/jordantian/Documents/Plank-timer/app/globals.css` - Global styles
  - Customize colors and animations

## Next Steps

After deployment:
1. Test on real mobile devices (iOS and Android)
2. Share the URL with your community
3. Post videos to Discord
4. Track your progress!

## Support

Need help? Join the Discord community:
[Discord Link](https://discord.com/channels/1210290974601773056/1438326766279196782)
