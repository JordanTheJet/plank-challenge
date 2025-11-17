# Plank Challenge Timer - Product Plan
**Last Updated:** November 17, 2025
**Target Users:** Private Discord community members
**Platform Priority:** Mobile-first web app

---

## 1. Executive Summary

A lightweight, browser-based plank challenge timer that enables Discord community members to record themselves planking with an overlay timer and easily share to their community channel. The challenge starts at 30 seconds (Nov 17) and increases by 6 seconds daily, with rest days every Sunday.

**Key Success Factor:** Minimize friction from "wanting to plank" to "video posted in Discord" - target under 2 minutes for the complete flow.

---

## 2. User Stories & Acceptance Criteria

### Epic: Core Recording Experience

#### Story 1: Daily Timer Calculation
**As a** community member participating in the plank challenge
**I want to** see the correct plank duration for today automatically
**So that** I know how long to hold my plank without manual calculation

**Acceptance Criteria:**
- GIVEN today is November 17, 2025, WHEN I load the app, THEN I see "30 seconds" as today's target
- GIVEN today is November 18, 2025, WHEN I load the app, THEN I see "36 seconds" as today's target
- GIVEN today is any Sunday, WHEN I load the app, THEN I see a rest day message
- GIVEN the date calculation is correct, WHEN displayed, THEN show format "Day X: [Duration]s"
- GIVEN it's a rest day (Sunday), WHEN shown, THEN display "Rest Day - Next challenge: Monday, [date] - [duration]s"

**Edge Cases:**
- Handle timezone differences (use user's local time)
- Display correct day count accounting for rest days (Sunday = no increment to day counter)
- Start date hardcoded: November 17, 2025 = Day 1

---

#### Story 2: Pre-Recording Countdown
**As a** user about to record my plank
**I want** a 3-second countdown before the timer starts
**So that** I have time to get into proper plank position

**Acceptance Criteria:**
- GIVEN I press "Start Recording", WHEN countdown begins, THEN I see "3... 2... 1..." display prominently
- GIVEN countdown is running, WHEN displayed, THEN countdown numbers are large (at least 72px font)
- GIVEN countdown completes, WHEN timer starts, THEN I hear an audible beep/tone (user can mute)
- GIVEN countdown is running, WHEN I tap screen, THEN nothing happens (no accidental cancellation)
- GIVEN camera permission is denied, WHEN detected, THEN show clear error message before countdown

**Technical Notes:**
- Audio cue must work on iOS Safari (requires user interaction to unlock audio)
- Countdown does NOT appear in final video recording

---

#### Story 3: Timer Overlay During Recording
**As a** user recording my plank
**I want** a clear timer overlay showing elapsed time
**So that** I can track my progress and viewers can see my time in the video

**Acceptance Criteria:**
- GIVEN recording is active, WHEN timer runs, THEN display format "MM:SS" (e.g., "00:30")
- GIVEN timer is overlaid, WHEN positioned, THEN it's visible but not covering my face (default: top-center)
- GIVEN timer hits target duration, WHEN complete, THEN flash green and show "Complete!" for 1 second
- GIVEN target time is reached, WHEN shown, THEN recording automatically stops after "Complete!" message
- GIVEN timer is displayed, WHEN styled, THEN use high-contrast colors (white text, semi-transparent black background)

**Visual Specifications:**
- Font: Monospace, 48px (mobile), bold weight
- Position: Top-center, 20px from top edge
- Background: rgba(0, 0, 0, 0.6) with 8px border-radius
- Success state: Green flash (#00FF00) with "Complete!" text

---

#### Story 4: Video Recording & Camera Access
**As a** user on mobile
**I want** to record myself using my phone's camera
**So that** I can capture my plank with the timer overlay

**Acceptance Criteria:**
- GIVEN I'm on the landing page, WHEN I tap "Start Today's Plank", THEN browser requests camera permission
- GIVEN camera permission is granted, WHEN preview shows, THEN I see myself in real-time before recording starts
- GIVEN recording is active, WHEN capturing, THEN video includes timer overlay baked into the recording
- GIVEN I'm on mobile, WHEN camera activates, THEN use rear-facing camera by default (easier to prop up phone)
- GIVEN recording completes, WHEN stopped, THEN video is stored in browser memory immediately

**Mobile-Specific Requirements:**
- Support iOS Safari, Chrome Android as primary browsers
- Handle mobile orientation (prefer landscape for planking but support portrait)
- Video resolution: 720p (balance between quality and file size)
- Max file size target: ~10-15MB for a 60-second video

**Error Handling:**
- Clear messaging if camera permission denied
- Fallback instructions if browser doesn't support MediaRecorder API
- Warning if storage quota is low

---

#### Story 5: Post-Recording Download
**As a** user who just completed my plank
**I want** to immediately download my video
**So that** I can upload it to Discord without extra steps

**Acceptance Criteria:**
- GIVEN recording completes, WHEN stopped, THEN show "Download Video" button immediately
- GIVEN I tap "Download Video", WHEN clicked, THEN video file downloads to my device
- GIVEN video downloads, WHEN saved, THEN filename format is "plank-day[X]-[YYYY-MM-DD].webm"
- GIVEN video is downloaded, WHEN complete, THEN show success message with Discord link button
- GIVEN on mobile, WHEN downloaded, THEN video saves to Downloads folder or triggers share sheet

**UX Flow:**
```
Recording Completes →
"Download Video" button appears →
User taps →
Video downloads →
Success message: "Video saved! Ready to post?" [Go to Discord] button
```

---

### Epic: Navigation & Information Architecture

#### Story 6: Discord Integration Link
**As a** user ready to share my video
**I want** a quick link to the Discord channel
**So that** I don't have to search for where to post

**Acceptance Criteria:**
- GIVEN I'm on success screen, WHEN I tap "Go to Discord", THEN opens https://discord.com/channels/1210290974601773056/1438326766279196782 in new tab
- GIVEN I'm on landing page, WHEN viewing, THEN see persistent "Post to Discord" link in header/footer
- GIVEN link opens, WHEN on mobile, THEN attempts to open Discord app if installed (deeplink)
- GIVEN Discord link fails, WHEN detected, THEN show fallback with channel ID to copy

---

#### Story 7: Rest Day Experience
**As a** user visiting on Sunday
**I want** to see a rest day message and what's next
**So that** I stay engaged with the challenge without feeling I missed something

**Acceptance Criteria:**
- GIVEN today is Sunday, WHEN I load the app, THEN see heading "Rest Day - Great job this week!"
- GIVEN rest day message shows, WHEN displayed, THEN show tomorrow's challenge details: "Next challenge: Monday, [date] - [duration]s (Day X)"
- GIVEN on rest day, WHEN viewing, THEN "Start Recording" button is replaced with "See You Tomorrow!"
- GIVEN on rest day, WHEN user scrolls, THEN show weekly summary: "This week: Days completed [X/6]" (if tracking implemented)

---

### Epic: Progressive Enhancement (Post-MVP)

#### Story 8: Preview & Retake (Future)
**As a** user who just recorded
**I want** to preview my video before downloading
**So that** I can retake if I'm not satisfied

**Priority:** P2 (After MVP launch)
**Acceptance Criteria:**
- Recording completes → Preview screen with video playback
- Options: "Download" or "Retake"
- Retake clears previous recording and returns to countdown

---

#### Story 9: Streak Tracking (Future)
**As a** regular participant
**I want** to see my completion streak
**So that** I stay motivated to continue daily

**Priority:** P2 (After MVP launch)
**Dependencies:** Requires localStorage persistence
**Acceptance Criteria:**
- Show "X day streak" on landing page
- Mark calendar days as complete after download
- Reset streak if day missed (excluding Sundays)

---

## 3. MVP Feature Breakdown

### IN SCOPE - MVP (Launch Week of Nov 17)

**Must Have:**
1. Date-based timer calculation (30s + 6s per day since Nov 17)
2. Sunday rest day logic and messaging
3. 3-second pre-recording countdown
4. Real-time timer overlay during recording
5. Mobile camera access (rear-facing default)
6. Video recording with timer baked into output
7. One-tap download of video file
8. Discord channel direct link
9. Basic responsive layout (mobile-first)
10. Error handling for camera permissions

**Quality Bar:**
- Works on iOS Safari and Chrome Android
- Video records at 720p
- Timer is clearly visible and correctly overlaid
- Download flow works in <3 taps
- No video processing on server (100% client-side)

---

### OUT OF SCOPE - Post-MVP

**Future Enhancements (Backlog):**
1. Video preview/retake functionality
2. Streak tracking and calendar view
3. AI-based plank form detection (auto start/stop)
4. Direct Discord upload (requires OAuth + bot)
5. Leaderboard or social features
6. Custom timer styling/themes
7. Export to other platforms (Instagram, TikTok)
8. Multi-user challenges or teams
9. Historical video gallery
10. Desktop webcam optimization

**Explicitly Not Building:**
- User authentication (not needed for MVP)
- Backend storage of videos
- Social features within app
- Progress analytics/charts
- Challenge customization (different durations, schedules)

---

## 4. User Flow - Happy Path

### Primary Flow: First-Time User on Day 1

```
1. LAND ON APP
   URL: plank-challenge.vercel.app
   Screen shows:
   - "30-Day Plank Challenge"
   - "Day 1: 30 seconds"
   - [Start Today's Plank] button
   - Small link: "Post to Discord →"

2. TAP START
   → Browser requests camera permission
   → User grants permission
   → Camera preview appears (rear-facing)
   → Screen shows: "Position your phone and get ready"
   → [Begin Countdown] button

3. TAP BEGIN COUNTDOWN
   → 3... 2... 1... (large numbers)
   → Beep sound
   → Recording starts automatically

4. RECORDING IN PROGRESS
   → Timer overlay appears: "00:00"
   → Timer counts up: "00:01", "00:02"...
   → User holds plank
   → At 00:30: Flash green + "Complete!"
   → Recording auto-stops after 1 second

5. POST-RECORDING
   Screen shows:
   - Preview thumbnail (optional stretch goal)
   - "Great work! Day 1 complete!"
   - [Download Video] button (primary CTA)

6. DOWNLOAD VIDEO
   → User taps button
   → File downloads: "plank-day1-2025-11-17.webm"
   → Success message: "Video saved!"
   → [Go to Discord] button appears

7. POST TO DISCORD
   → User taps "Go to Discord"
   → Opens Discord channel in new tab/app
   → User manually uploads video from Downloads
   → FLOW COMPLETE

Total time: ~2-3 minutes (including 30s plank)
```

---

### Alternate Flow: Returning User on Rest Day (Sunday)

```
1. LAND ON APP (Sunday)
   Screen shows:
   - "Rest Day"
   - "Great job this week!"
   - "Next challenge: Monday, Nov 18 - 36 seconds (Day 2)"
   - No recording button
   - [Go to Discord] to see community posts

2. USER EXITS
   → Returns on Monday for next challenge
```

---

### Error Flow: Camera Permission Denied

```
1. User taps "Start Today's Plank"
2. Camera permission denied
3. Error screen shows:
   - "Camera access needed"
   - "To record your plank, enable camera in browser settings"
   - [Instructions] expandable section
   - [Try Again] button
```

---

## 5. Key UX Considerations

### Mobile Recording Experience

**Challenge:** Users need to position phone, get into plank position, and start recording hands-free.

**Solutions:**
1. **3-second countdown:** Critical buffer time for positioning
2. **Audio cue:** Beep when recording starts (helps when phone is propped up and screen not visible)
3. **Auto-stop:** No need to tap "stop" - timer ends automatically
4. **Large timer:** Visible from plank position (user is ~2-3 feet from propped phone)
5. **High contrast:** White text on dark semi-transparent background for visibility in various lighting

**Phone Positioning Guidance:**
- Include visual guide on landing page: "Prop your phone at chest height, 3-4 feet away"
- Recommend landscape orientation (shows full body in frame)
- Suggest using phone stand or leaning against object

---

### Timer Visibility & Styling

**Requirements:**
- Readable from 3 feet away while planking
- Doesn't obscure user's face/body
- High contrast in bright gym lighting or dim home lighting
- Professional appearance (this gets shared publicly)

**Design Specs:**
```
Position: Top-center, 20px from top
Font: 'Roboto Mono' or system monospace
Size: 48px (mobile), 64px (tablet+)
Color: #FFFFFF (white)
Background: rgba(0, 0, 0, 0.7)
Padding: 12px 24px
Border-radius: 8px
Drop shadow: 0 2px 8px rgba(0,0,0,0.3)

Success State (at target time):
- Flash green background: rgba(0, 255, 0, 0.9)
- Show "Complete!" text for 1 second
- Then auto-stop recording
```

---

### Download & Share Flow

**Mobile Challenge:** Downloads on mobile often go to Downloads folder where users may not find them easily.

**UX Improvements:**
1. **Clear filename:** "plank-day1-2025-11-17.webm" - easy to identify in folder
2. **Success message:** "Video saved to Downloads" with icon
3. **Immediate next step:** "Go to Discord" button prevents user from getting lost
4. **Future enhancement:** Trigger native share sheet on mobile (allows direct share to Discord app)

**File Format Considerations:**
- Primary: WebM (best browser support, good compression)
- Fallback: MP4 if WebM not supported
- Target size: 10-15MB for ~60 second video
- Discord upload limit: 25MB (8MB on free tier) - we're well under

---

### Rest Day Engagement

**Goal:** Keep users engaged even when they're not recording.

**Strategy:**
1. Show positive messaging: "Rest Day - Great job this week!"
2. Build anticipation: "Next challenge: Monday - 36 seconds"
3. Maintain connection: Link to Discord to see community posts
4. Future: Show weekly summary or streak data

---

### Accessibility Considerations

**For MVP:**
- High contrast timer (WCAG AA compliant)
- Clear, large touch targets (min 44x44px)
- Audio cue can be muted (for quiet environments)
- Simple, linear flow with clear CTAs

**Future Enhancements:**
- Screen reader support for timer announcements
- Voice commands for start/stop (hands-free)
- Haptic feedback on countdown/completion (mobile vibration)

---

## 6. Technical Constraints & Considerations

### Browser API Dependencies

**Critical APIs Required:**
1. **MediaStream API (getUserMedia):** Camera access
   - Support: iOS Safari 11+, Chrome Android 53+
   - Constraint: Requires HTTPS (Vercel provides this)

2. **MediaRecorder API:** Video recording
   - Support: iOS Safari 14.3+, Chrome Android 47+
   - Limitation: iOS Safari only supports MP4, Chrome supports WebM

3. **Canvas API:** Timer overlay rendering
   - Alternative approach: Use HTML overlay and capture with captureStream()

4. **Web Audio API:** Countdown beep sound
   - Constraint: iOS requires user interaction to unlock audio
   - Solution: Trigger on "Start Recording" tap

**Compatibility Matrix:**
| Browser | Camera | Recording | Overlay | Audio |
|---------|--------|-----------|---------|-------|
| iOS Safari 15+ | ✓ | ✓ (MP4) | ✓ | ✓ |
| Chrome Android | ✓ | ✓ (WebM) | ✓ | ✓ |
| Firefox Android | ✓ | ✓ | ✓ | ✓ |
| Desktop Chrome | ✓ | ✓ | ✓ | ✓ |

**Minimum Supported:** iOS Safari 14.3+, Chrome Android 90+

---

### Video Recording Architecture

**Approach 1: Canvas-based Overlay (Recommended)**
```
User's camera → MediaStream →
Canvas element draws:
  1. Video frame
  2. Timer overlay on top →
captureStream() → MediaRecorder →
Blob → Download
```

**Pros:**
- Complete control over timer rendering
- Guaranteed overlay in final video
- Can add additional graphics later

**Cons:**
- Slightly more complex implementation
- Requires canvas drawing on every frame

---

**Approach 2: HTML Overlay Capture**
```
Camera feed in <video> element →
Timer overlay in <div> positioned absolutely →
Capture entire viewport area with getDisplayMedia() or captureStream() →
MediaRecorder → Blob → Download
```

**Pros:**
- Simpler HTML/CSS for overlay
- Easier styling

**Cons:**
- getDisplayMedia() requires user to select screen (extra step)
- Video element captureStream() may not capture HTML overlays on all browsers

**Recommendation:** Use Approach 1 (Canvas-based) for reliability.

---

### Storage & File Handling

**No Backend Storage:**
- Videos stored in browser memory only (as Blob)
- Immediately downloaded to user's device
- No server-side storage = no costs, no privacy concerns

**LocalStorage for Future Features:**
- Streak tracking: Store completion dates
- Settings: Audio preferences, camera choice
- Limit: 5-10MB should be sufficient (storing dates/settings only, not videos)

**Download Implementation:**
```javascript
// Create blob URL from recorded video
const url = URL.createObjectURL(videoBlob);

// Trigger download
const a = document.createElement('a');
a.href = url;
a.download = `plank-day${dayNumber}-${formattedDate}.webm`;
a.click();

// Clean up
URL.revokeObjectURL(url);
```

---

### Date & Timer Calculation Logic

**Start Date:** November 17, 2025 = Day 1 = 30 seconds
**Increment:** +6 seconds per day (excluding Sundays)
**Rest Days:** Every Sunday

**Calculation Algorithm:**
```
1. Get today's date (user's local timezone)
2. Calculate days elapsed since Nov 17, 2025
3. Count Sundays in that range (exclude from day count)
4. Effective day number = days elapsed - Sundays
5. Duration = 30 + (effective day number - 1) * 6
6. If today is Sunday → Rest day, show next day's info
```

**Example Timeline:**
- Nov 17 (Sun): Rest day, show "Mon Nov 18: Day 1, 30s"
- Nov 18 (Mon): Day 1 = 30s
- Nov 19 (Tue): Day 2 = 36s
- Nov 20 (Wed): Day 3 = 42s
- ...
- Nov 24 (Sun): Rest day
- Nov 25 (Mon): Day 7 = 66s

**Edge Cases:**
- User in different timezone: Use local time for date comparison
- User visits before Nov 17: Show "Challenge starts Nov 17"
- Future: Handle challenge end date (30 actual plank days = ~35 calendar days with Sundays)

---

### Performance & Optimization

**Target Performance:**
- Initial page load: <2 seconds on 4G
- Camera activation: <1 second after permission granted
- Recording start: <500ms after countdown completes
- Video download: Immediate (already in memory)

**Optimization Strategies:**
1. **Minimal JavaScript:** Use vanilla JS or lightweight framework (Svelte/Preact)
2. **No video processing:** Direct MediaRecorder output, no transcoding
3. **Lazy load Discord link:** External channel opens in new tab, doesn't block app
4. **Service worker (future):** Offline functionality for timer calculation
5. **Compress assets:** Optimize any images/icons used

**Bundle Size Target:** <50KB initial JS (gzipped)

---

### Hosting on Vercel

**Requirements:**
- Static site (HTML/CSS/JS)
- HTTPS (required for getUserMedia)
- Custom domain (optional)

**Vercel Configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": null,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Permissions-Policy",
          "value": "camera=*, microphone=*"
        }
      ]
    }
  ]
}
```

**Deployment Notes:**
- No serverless functions needed (100% client-side)
- No environment variables needed
- Auto-deploy on git push (connect to GitHub repo)
- Free tier sufficient (static hosting only)

---

### Security & Privacy Considerations

**Camera Access:**
- Only request when user taps "Start"
- Never auto-request on page load
- Clear messaging about why camera is needed

**Data Privacy:**
- No video data sent to server
- No analytics on video content
- No user authentication = no PII collected
- Videos deleted from browser memory after download

**HTTPS Requirement:**
- getUserMedia requires secure context
- Vercel provides automatic HTTPS

**Future Considerations:**
- If adding streak tracking: Local storage only, no server sync
- If adding AI features: Process video locally with TensorFlow.js (no server upload)

---

## 7. Success Metrics for MVP

### Primary Success Metrics (Week 1)

**Activation:**
- **Camera permission grant rate:** Target >80%
  - Measures: Users who grant camera access / Users who tap "Start"
  - Why: Low rate indicates trust issues or unclear messaging

- **Recording completion rate:** Target >90%
  - Measures: Users who complete full plank / Users who start recording
  - Why: Indicates technical reliability and UX clarity

**Engagement:**
- **Daily active users:** Track unique visitors per day
  - Baseline: Unknown (new app)
  - Goal: 70%+ of Discord community (~50-100 users?) uses app by Day 3

- **Video download rate:** Target >95%
  - Measures: Users who download video / Users who complete recording
  - Why: Core conversion metric - did they get what they came for?

---

### Secondary Success Metrics

**Technical Performance:**
- **Error rate:** Target <5%
  - Track: Camera permission errors, recording failures, download failures
  - Monitored via: Browser console errors, user reports in Discord

- **Cross-browser usage:**
  - Track: iOS Safari vs Chrome Android split
  - Goal: >60% mobile traffic (validates mobile-first approach)

**User Behavior:**
- **Return rate:** Target >50%
  - Measures: Users who visit 2+ days in Week 1
  - Why: Indicates sticky daily habit formation

- **Discord link clicks:** Track taps on "Go to Discord"
  - Baseline: Unknown
  - Insight: Indicates users are following through to share

---

### Qualitative Feedback (Discord)

**Monitor in #plank-challenge channel:**
- Video quality satisfaction (timer visibility, video clarity)
- UX friction points (download issues, camera problems)
- Feature requests (preview, streak tracking, etc.)
- Sentiment: Are users excited or frustrated?

**Success Indicators:**
- Regular daily video posts in Discord
- Positive comments about ease of use
- Minimal bug reports
- Users encouraging others to join

---

### Failure Signals (Week 1)

**Red Flags:**
- <50% camera permission grant rate → Trust or UX problem
- <80% recording completion rate → Technical issues
- <30% return rate Day 2 → Poor first experience
- Multiple reports of same bug → Critical fix needed

**Action Triggers:**
- If camera errors >10%: Prioritize compatibility fixes
- If download failures >10%: Investigate browser-specific issues
- If Discord engagement low: Consider adding in-app sharing instructions

---

### Long-Term Success (Post-MVP)

**After 30 Days:**
- **Challenge completion rate:** % of Day 1 users who complete Day 30
- **Average streak:** Mean consecutive days completed
- **Retention curve:** Day 7, Day 14, Day 30 retention rates
- **Video sharing rate:** % of downloaded videos posted to Discord (manual tracking)

**Growth Indicators (if opening to public):**
- Organic traffic growth (vs direct Discord links)
- Social shares outside Discord
- Repeat challenge participation (if running again)

---

## 8. Open Questions for System Architect

### Technical Decisions Needed:

1. **Framework choice:** Vanilla JS, React, Svelte, or Preact?
   - Recommendation: Vanilla JS or Svelte (smallest bundle size)

2. **Timer overlay method:** Canvas-based or HTML captureStream()?
   - Recommendation: Canvas for reliability (see Technical Constraints section)

3. **Video format strategy:** WebM only, MP4 only, or detect/transcode?
   - Recommendation: Use MediaRecorder's default format (WebM on Chrome, MP4 on Safari)

4. **Audio cue implementation:** Web Audio API tone or <audio> element with MP3?
   - Recommendation: Web Audio API (smaller, no asset file)

5. **Error tracking:** Console only or integrate Sentry/LogRocket?
   - Recommendation: Start with console, add Sentry if error rate >5%

### UX Decisions Needed:

6. **Camera default:** Rear-facing or user-facing (front) camera on mobile?
   - Recommendation: Rear-facing (easier to prop up phone while planking)

7. **Timer position:** Top-center, bottom-center, or user-configurable?
   - Recommendation: Top-center for MVP (least likely to cover body)

8. **Countdown display:** Numbers only or include "Get ready..." text?
   - Recommendation: Numbers only (simpler, clearer)

### Scope Clarifications:

9. **Video preview:** Must-have for MVP or can be post-launch?
   - Decision: Out of scope for MVP (adds complexity, delays launch)

10. **Streak tracking:** Must-have for MVP or can be post-launch?
    - Decision: Out of scope for MVP (focus on core recording flow)

---

## 9. Development Phases

### Phase 1: Core Recording (Days 1-3)
- Date calculation logic with Sunday rest days
- Camera access and permission handling
- Basic video recording with MediaRecorder
- Download functionality

**Milestone:** Can record blank video and download it

---

### Phase 2: Timer Overlay (Days 4-5)
- Canvas-based timer overlay
- 3-second countdown implementation
- Timer styling and positioning
- Auto-stop at target duration

**Milestone:** Timer visible in downloaded video

---

### Phase 3: UX Polish (Days 6-7)
- Mobile-responsive layout
- Discord integration link
- Rest day screen and messaging
- Error handling and user feedback
- Audio cue for countdown

**Milestone:** Complete happy path works end-to-end

---

### Phase 4: Testing & Launch (Days 8-9)
- Cross-browser testing (iOS Safari, Chrome Android)
- Bug fixes
- Performance optimization
- Vercel deployment setup
- Soft launch to Discord community

**Milestone:** Live on Vercel, shared in Discord

---

### Phase 5: Monitor & Iterate (Week 2+)
- Monitor metrics and Discord feedback
- Fix critical bugs
- Consider Phase 2 features based on feedback

---

## 10. Risk Assessment

### High Risk

**Risk:** iOS Safari camera/recording compatibility issues
**Likelihood:** Medium | **Impact:** High
**Mitigation:**
- Test on real iOS devices early (Day 2-3)
- Have fallback messaging if MediaRecorder not supported
- Document iOS version requirements clearly

**Risk:** Timer overlay not appearing in final video
**Likelihood:** Low | **Impact:** High
**Mitigation:**
- Use canvas-based approach (proven reliability)
- Test recording+download on all target browsers Day 4
- Have QA checklist for timer visibility

---

### Medium Risk

**Risk:** Users can't find downloaded video on mobile
**Likelihood:** Medium | **Impact:** Medium
**Mitigation:**
- Use clear filename with date
- Show success message with "Check your Downloads folder"
- Future: Add native share sheet integration

**Risk:** Camera permission denied by users
**Likelihood:** Medium | **Impact:** Medium
**Mitigation:**
- Explain why camera is needed before requesting
- Provide clear troubleshooting steps
- Show example video on landing page to build trust

---

### Low Risk

**Risk:** Video file size too large for Discord upload
**Likelihood:** Low | **Impact:** Low
**Mitigation:**
- Target 720p resolution (balance quality/size)
- Test file sizes early
- Discord limit is 25MB (we should be 10-15MB)

**Risk:** Users forget to check app daily
**Likelihood:** High | **Impact:** Low (not technical)
**Mitigation:**
- Rely on Discord community for reminders
- Future: Add browser notifications (post-MVP)

---

## 11. Next Steps

### For System Architect:
1. Review technical constraints and choose implementation approach
2. Set up project repository and Vercel connection
3. Decide on framework/no-framework approach
4. Create technical architecture document
5. Define component structure and data flow

### For Developers:
1. Wait for architecture doc
2. Set up local development environment
3. Begin Phase 1 implementation
4. Daily check-ins on progress

### For PM (You):
1. Share this plan with team
2. Create feedback channel in Discord for beta testing
3. Draft launch announcement for Discord
4. Prepare user guide/FAQ for common issues
5. Monitor Discord for early feedback post-launch

---

## Appendix: Example User Scenarios

### Scenario A: Sarah (Successful First-Time User)
**Context:** Day 1, at home with yoga mat, iPhone 13
**Flow:**
1. Clicks link from Discord → Lands on app
2. Sees "Day 1: 30 seconds"
3. Taps "Start Today's Plank" → Grants camera permission
4. Sees herself in camera preview
5. Props phone on water bottle
6. Taps "Begin Countdown"
7. Gets into plank position during 3-2-1 countdown
8. Hears beep, holds plank for 30 seconds
9. Timer hits 00:30, flashes green "Complete!"
10. Recording stops, sees "Download Video" button
11. Taps download, video saves
12. Taps "Go to Discord", uploads video to channel
**Outcome:** Success! Total time ~3 minutes

---

### Scenario B: Mike (Camera Permission Issue)
**Context:** Day 3, at gym, Android phone
**Flow:**
1. Opens app → Sees "Day 3: 42 seconds"
2. Taps "Start" → Camera permission denied (accidentally)
3. Sees error: "Camera access needed"
4. Reads instructions, goes to Settings
5. Enables camera for site
6. Returns to app, taps "Try Again"
7. Permission granted, continues flow successfully
**Outcome:** Success after minor friction (acceptable)

---

### Scenario C: Lisa (Rest Day)
**Context:** Sunday, checking phone at home
**Flow:**
1. Opens app → Sees "Rest Day - Great job this week!"
2. Reads "Next challenge: Monday, Dec 2 - 48 seconds (Day 6)"
3. Taps "Go to Discord" to see others' videos
4. Exits app, returns Monday
**Outcome:** Stayed engaged without recording

---

**END OF PRODUCT PLAN**
