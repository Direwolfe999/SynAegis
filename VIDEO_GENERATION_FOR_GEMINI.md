# VIDEO GENERATION SCRIPT FOR GEMINI
## Use this to generate your Devpost demo video with Claude/Gemini

---

## PART 1: IMAGE REQUIREMENTS FOR GEMINI VIDEO GENERATION

**You need to provide these screenshots to Gemini:**

### 1. **Intro Page Screenshot** (0:00-0:30)
- **Where to get it:** Open Kinesis UI → initial intro page shows
- **What to capture:** 
  - Full screen showing beautiful animated intro with Kinesis logo
  - Feature cards visible (Gemini, Live API, WebSocket, Full Stack)
  - "Enter Kinesis" button visible
- **File:** `screenshot-intro.png`
- **Settings:** 1080p, full browser window, no zoom

### 2. **Live Agent Interface Screenshot** (0:30-2:30)
- **Where to get it:** Click "Enter Kinesis" to dismiss intro
- **What to capture:**
  - Main UI with the glowing orb in center
  - Status indicators on right side
  - Transcript area showing conversation
  - System logs visible at bottom (for credibility)
- **File:** `screenshot-main-ui.png`
- **Settings:** Same as above

### 3. **Barge-In / Interruption State** (1:30-2:30)
- **Where to get it:** During conversation, speak to interrupt mid-response
- **What to capture:**
  - Orb in "Listening" state (usually blue/pulsing)
  - "🎙 Listening" indicator visible
  - Previous response still showing in transcript
  - New user input appearing
- **File:** `screenshot-barge-in.png`
- **Settings:** Capture during interruption

### 4. **System Logs / Architecture View** (2:30-3:30)
- **Where to get it:** Open Chrome DevTools → Console tab (Press F12)
- **What to capture:**
  - Console showing system logs with timestamps
  - Messages like "✅ Connection established", "🎙 Listening", "📤 Sending audio"
  - Fallback messages if quota is hit (optional)
  - Clean, readable log entries
- **File:** `screenshot-logs.png`
- **Settings:** DevTools in lower half of screen, main UI visible above

### 5. **Architecture Diagram** (3:00-3:30)
- **Where to get it:** Open `DEVPOST_DESCRIPTION_FINAL.md`
- **What to capture:** The box diagram showing:
  ```
  Browser → FastAPI → Gemini Live API
           ↓
        Fallback models
  ```
- **File:** `screenshot-architecture.txt` (text is fine)

---

## PART 2: SCREENSHOT LOCATIONS (WHERE TO CLICK)

### Taking Screenshots

**Windows/Linux:**
- PrtSc (full screen) → paste in Paint
- Win+Shift+S (screenshot tool)
- Use browser DevTools: Right-click → Screenshot

**Mac:**
- Cmd+Shift+4 (select area)
- Cmd+Shift+5 (record video - even better!)

**Browser DevTools Screenshots:**
```
1. Press F12 (open DevTools)
2. Press Ctrl+Shift+P (Windows) or Cmd+Shift+P (Mac)
3. Type "screenshot"
4. Select "Capture full page screenshot"
```

### Recommended Areas to Screenshot

| Time | What | Screenshot | Why |
|------|------|-----------|-----|
| 0:00 | Intro page | Full screen, logo centered | Shows professionalism |
| 0:30 | Main UI | Orb + status + transcript | Shows live interaction |
| 1:30 | Barge-in | "Listening" state | Shows interruption feature |
| 2:30 | Console logs | DevTools open | Shows transparency + architecture |
| 3:00 | Architecture | Diagram visible | Explains technical approach |

---

## PART 3: PROMPT TO GIVE GEMINI FOR VIDEO GENERATION

Copy this and paste it into Gemini (Claude) along with your screenshots:

---

### GEMINI VIDEO GENERATION PROMPT

```
You are a professional video script generator. I'm creating a 3-4 minute demo video 
for the Google Gemini Live Agent Challenge. Here are the requirements:

TITLE: "Kinesis: The Living Multimodal Agent"

SCREENSHOTS PROVIDED:
1. intro.png - The beautiful Kinesis intro page with animated logo
2. main-ui.png - Live agent interface with glowing orb
3. barge-in.png - System in "Listening" state after interruption
4. logs.png - Console showing system events and logs
5. architecture.txt - Technical architecture diagram

VIDEO STRUCTURE (3-4 minutes total):

[0:00-0:30] INTRODUCTION & INTRO PAGE
- Show intro page (use intro.png)
- Narrate: "Meet Kinesis, a real-time multimodal agent built on Google's Gemini Live API"
- Mention: Live audio, video, and text interaction
- Highlight the animated logo and feature cards
- Voiceover tone: Confident, technical, but accessible

[0:30-1:30] LIVE INTERACTION DEMO
- Show main UI (use main-ui.png)
- Narrate: "Ask Kinesis a question. Watch it respond in real-time."
- Example queries:
  * "What makes the Gemini Live API revolutionary?"
  * "Explain multimodal AI in simple terms"
  * "How does real-time streaming work?"
- Show response streaming character by character
- Point out: Glowing orb state changes, transcript updating live
- Highlight: No turn-based Q&A, truly continuous interaction

[1:30-2:30] BARGE-IN INTERRUPTION FEATURE
- Show what happens when you interrupt (use barge-in.png)
- Narrate: "Now the powerful part. Interrupt Kinesis mid-sentence."
- Explain: "Kinesis stops, says 'Listening', and pivots instantly to your new input"
- Show: New transcript entry, orb switching to listening state
- Emphasize: < 500ms response time, feels human
- Call out: Most AI agents are turn-based; Kinesis is genuinely conversational

[2:30-3:30] ARCHITECTURE & RELIABILITY
- Show console logs (use logs.png)
- Narrate: "Behind the scenes, Kinesis is managing complex infrastructure"
- Point to logs: "Every event is logged: connections, audio streams, model switches"
- Show architecture diagram (use architecture.txt)
- Explain: "If the primary model hits quota, Kinesis automatically cascades to 
  secondary model, then tertiary, then local audio synthesis"
- Key insight: "This graceful degradation ensures the demo never breaks"
- Mention: "No billing account required. Free tier only."

[3:30-4:00] CALL TO ACTION & CLOSING
- Return to intro page
- Narrate: "Kinesis proves AI can be alive in real-time"
- Show GitHub: "github.com/Direwolfe999/Kinesis"
- Say: "Built for the Gemini Live Agent Challenge"
- Ending: "Realtime. Multimodal. Alive."
- Final visual: Kinesis logo with fade-out

TONE & STYLE:
- Professional but not stiff
- Technical but accessible to non-experts
- Enthusiastic (this is innovative!)
- Pacing: Clear narration, let visuals breathe
- Music: Optional subtle background (lo-fi or tech ambient)
- Text overlays: Add labels like "Live Audio Stream" or "Barge-In Interruption"

VISUAL EFFECTS (optional but nice):
- Highlight the orb when it changes state (glow highlight)
- Circle important logs in console
- Add arrows pointing to key UI elements
- Fade transitions between sections

VOICEOVER SCRIPT:
[I'll provide exact voiceover words below]

Please generate a professional video script with:
1. Exact voiceover dialogue (word-by-word)
2. Timing markers for each section
3. Visual effects recommendations
4. Text overlay suggestions
5. Background music mood suggestions
6. Tips for making it engaging for judges

Make it compelling and technically accurate.
```

---

## PART 4: EXACT VOICEOVER SCRIPT (READ THIS ALOUD)

---

### [0:00-0:30] INTRO
```
"Hi, I'm showing you Kinesis—a real-time multimodal agent powered by 
Google's Gemini Live API.

Unlike traditional chatbots, Kinesis doesn't wait for turns. 
It perceives continuously through audio and video, responds instantly, 
and adapts when you interrupt.

This is the future of AI interaction."
```

### [0:30-1:30] LIVE INTERACTION
```
"Let me show you. I'll ask Kinesis a question in real-time.

[Speak to agent]: 'What's unique about the Gemini Live API?'

[Watch response stream]

Notice how the response streams character by character. 
The orb glows, showing the agent is thinking. 
The transcript updates live. 
No buffering. No waiting for turn completion.

This is true real-time interaction."
```

### [1:30-2:30] BARGE-IN
```
"Now the powerful part. Watch what happens when I interrupt.

[Speak mid-response]: 'Wait, how does that compare to other models?'

[Watch interruption happen]

Kinesis stops immediately. It says 'Listening'. 
And it pivots to my new question. 
All within 300 milliseconds.

Most AI agents are turn-based—you ask, it responds, you ask again.
Kinesis is different. It feels like talking to a person.
That's the innovation here."
```

### [2:30-3:30] ARCHITECTURE & FALLBACK
```
"Let's look under the hood.

[Show console logs]

Every event is logged: connection established, audio streaming, 
model responses, fallback triggers.

Here's the reliability story: If the primary model hits its quota,
Kinesis automatically cascades to a secondary model.
If that's constrained, it tries a tertiary model.
If all cloud models fail, it uses local speech synthesis.

The user never sees 'Connection Lost' or 'API Error'. 
The conversation keeps flowing.

[Show architecture]

This is production-grade thinking. 
Most hackathon entries don't handle failure gracefully.
Kinesis does.

And it all runs free-tier. No billing account required."
```

### [3:30-4:00] CLOSING
```
"Kinesis proves that AI can be truly alive in real-time.

It's not just smart. It's responsive. It's present.

Check out the code: github.com/Direwolfe999/Kinesis

Built for the Gemini Live Agent Challenge.

Realtime. Multimodal. Alive."

[Fade to logo]
```

---

## PART 5: HOW TO USE THIS WITH GEMINI

1. **Take the 5 screenshots** (following the guide above)
2. **Copy the PROMPT above** into a new Gemini conversation
3. **Upload your screenshots** to the conversation
4. **Ask Gemini:** 
   ```
   "Generate a complete video script for these images using this prompt:
   [paste the prompt above]"
   ```
5. **Gemini will provide:**
   - Full voiceover script with timing
   - Visual effects recommendations
   - Text overlay suggestions
   - Editing tips
   - Music recommendations

---

## PART 6: VIDEO EDITING (AFTER RECORDING)

Once you have your raw screen recording:

1. **Use CapCut** (free, easy)
   - Import your recording
   - Add voiceover (record the script above)
   - Add transitions between sections
   - Add text overlays (labels like "Live Audio Stream")
   - Export as MP4

2. **Or use OBS Studio** (free, more control)
   - Start new recording
   - Replay the demo
   - Add text sources for labels
   - Add audio voiceover track
   - Export as MP4

3. **Or use QuickTime** (Mac only)
   - Record screen + voiceover simultaneously
   - Edit with iMovie
   - Export as MP4

---

## PART 7: FINAL CHECKLIST BEFORE UPLOADING

- [ ] Recording is 3-4 minutes (not too long)
- [ ] Voiceover is clear and professional
- [ ] All key features are shown (intro, live chat, barge-in, fallback)
- [ ] Visual transitions are smooth
- [ ] Audio is at consistent volume
- [ ] No accidental background noise
- [ ] Video is 1080p or higher
- [ ] File is MP4 format
- [ ] Uploaded to YouTube (unlisted or public)
- [ ] YouTube link ready for Devpost form

---

## QUICK REFERENCE: SCREENSHOT CHECKLIST

```
☐ intro.png     - Intro page with logo (0:00-0:30 section)
☐ main-ui.png   - Live agent interface (0:30-1:30 section)
☐ barge-in.png  - Listening state (1:30-2:30 section)
☐ logs.png      - DevTools console (2:30-3:30 section)
☐ architecture  - Technical diagram (reference for voiceover)
```

---

## SUBMIT YOUR DEMO

1. Upload final MP4 to YouTube
2. Copy GitHub: `https://github.com/Direwolfe999/Kinesis`
3. Go to Devpost form
4. Paste content from `DEVPOST_DESCRIPTION_FINAL.md`
5. Add YouTube link
6. Submit! 🎉

---

**Remember:** This script is designed to be compelling to judges. Show personality, 
show the innovation, show the production quality. You've got this!
