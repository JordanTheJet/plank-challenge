# Deployment Checklist

## Pre-Deployment Verification

- [x] Next.js project builds successfully (`npm run build`)
- [x] TypeScript compiles without errors
- [x] Tailwind CSS is properly configured
- [x] All components are implemented
- [x] Timer calculation logic with Sunday rest days works
- [x] Video recording with canvas overlay implemented
- [x] Mobile-first responsive design
- [x] Vercel configuration file created

## Local Testing

Before deploying, test these features locally:

### 1. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

### 2. Test Camera Permissions
- Grant camera access when prompted
- Verify rear camera preference on mobile (if testing on device)

### 3. Test Recording Flow
- Click "Start Recording"
- Verify 3-second countdown appears
- Confirm timer overlay renders on video
- Let timer complete
- Verify video downloads automatically

### 4. Test Rest Day Logic
Today's date (Nov 17, 2025) is a Sunday - the START_DATE.
To test different days, you can temporarily modify the START_DATE in `/Users/jordantian/Documents/Plank-timer/utils/timerLogic.ts`

### 5. Test on Mobile Devices
- iOS Safari: Test camera access and video download
- Chrome Android: Test camera access and video download

### 6. Verify Video File
- Check filename format: `plank-dayX-YYYY-MM-DD.webm`
- Verify timer is visible in recorded video
- Confirm video quality is acceptable

## Deployment to Vercel

### Method 1: Vercel Dashboard (Easiest)

1. **Push to GitHub**
```bash
git init
git add .
git commit -m "Initial commit: Plank Timer app"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Deploy on Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js (auto-detected)
     - Root Directory: ./
     - Build Command: `npm run build` (default)
     - Output Directory: `.next` (default)
   - Add Environment Variables (optional):
     - `NEXT_PUBLIC_DISCORD_URL`: Your Discord channel URL
   - Click "Deploy"

### Method 2: Vercel CLI

1. **Install Vercel CLI**
```bash
npm i -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

Follow the prompts:
- Set up and deploy? Yes
- Which scope? Your account
- Link to existing project? No
- What's your project's name? plank-timer
- In which directory is your code located? ./
- Want to override the settings? No

4. **Deploy to Production**
```bash
vercel --prod
```

## Post-Deployment Verification

After deployment, test on the live URL:

1. **Desktop Browsers**
   - [ ] Chrome (latest)
   - [ ] Safari (latest)
   - [ ] Firefox (latest)
   - [ ] Edge (latest)

2. **Mobile Browsers**
   - [ ] iOS Safari (iPhone)
   - [ ] Chrome Android
   - [ ] Samsung Internet (if applicable)

3. **Test Features**
   - [ ] Camera access works
   - [ ] Rear camera is default on mobile
   - [ ] Timer countdown works
   - [ ] Video recording completes
   - [ ] Timer overlay is visible in video
   - [ ] Video downloads automatically
   - [ ] Filename format is correct
   - [ ] Discord link opens correctly
   - [ ] Rest day (Sunday) shows correct screen

4. **Performance Check**
   - [ ] Page loads quickly (< 3 seconds)
   - [ ] No console errors
   - [ ] Video recording is smooth (30 FPS)
   - [ ] Timer overlay doesn't lag

## Environment Variables

Set these in Vercel Dashboard (Settings → Environment Variables):

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_DISCORD_URL` | Your Discord URL | Production, Preview, Development |

Default value is already set in the code if not provided.

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate to be issued

## Monitoring

After deployment, monitor:

1. **Vercel Dashboard**
   - Check deployment status
   - Monitor build logs
   - Review analytics

2. **Browser Console**
   - Check for JavaScript errors
   - Verify camera permissions
   - Monitor video recording

3. **User Feedback**
   - Collect feedback from Discord community
   - Monitor for issues on different devices

## Troubleshooting

### Deployment Fails

**Build Error**
```bash
# Locally test build
npm run build

# If successful locally, check Vercel build logs
# Common issues:
# - Missing environment variables
# - Node version mismatch
# - Dependency installation failures
```

**Fix**: Check Vercel build logs for specific errors

### Camera Not Working on Mobile

**Issue**: HTTPS is required for camera access

**Fix**: Vercel automatically provides HTTPS, but ensure you're not testing with HTTP

### Video Download Fails on iOS

**Issue**: iOS Safari has restrictions on auto-downloads

**Fix**: This is expected behavior. The code uses the best available method. Users may need to tap "Save" when prompted.

### Timer Overlay Not Visible

**Issue**: Canvas rendering issue

**Fix**: Check browser console for errors. Ensure MediaRecorder API is supported.

## Rollback Plan

If deployment has critical issues:

1. **Revert on Vercel**
   - Go to Deployments
   - Find previous working deployment
   - Click "..." menu → "Promote to Production"

2. **Fix Locally**
   - Identify issue in logs
   - Fix code locally
   - Test thoroughly
   - Redeploy

## Support

- **Documentation**: See README.md and QUICKSTART.md
- **Discord**: https://discord.com/channels/1210290974601773056/1438326766279196782
- **Vercel Support**: https://vercel.com/support

## Success Criteria

Deployment is successful when:
- [x] App builds and deploys without errors
- [ ] All features work on live URL
- [ ] Mobile testing passes (iOS and Android)
- [ ] Video recording and download work
- [ ] Timer overlay is visible in recorded videos
- [ ] Rest days (Sundays) display correctly
- [ ] Discord link works
- [ ] No critical console errors
- [ ] Performance is acceptable (< 3s load time)

## Next Steps After Deployment

1. Share the URL with your community
2. Post an announcement on Discord
3. Collect user feedback
4. Monitor for issues
5. Plan future enhancements based on feedback

## Future Enhancements (Optional)

Consider adding:
- [ ] Progress tracking dashboard
- [ ] Achievement badges
- [ ] Social sharing features
- [ ] Video upload to cloud storage
- [ ] Leaderboard
- [ ] Dark mode
- [ ] Multiple challenge types
- [ ] Workout reminders/notifications

---

**Deployment Date**: _____________________

**Deployed URL**: _____________________

**Deployed By**: _____________________
