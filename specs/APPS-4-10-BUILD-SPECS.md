# SalesAI Apps 4-10 — Build Specifications

These specs follow the same patterns established in Apps 1-3. Each app uses the **Ice & Midnight** base theme with a unique accent color and includes the postMessage bridge for marketplace key delivery.

---

## SHARED PATTERNS (apply to ALL apps)

### Base Theme
```css
--bg: #080B12;
--bg2: #0D1117;
--bg3: #161B22;
--text: #E6EDF3;
--text2: #A0A8B4;   /* brightened secondary */
--text3: #7A8494;   /* brightened tertiary */
--bdr: rgba(230,237,243,0.06);
--bdr-h: rgba(230,237,243,0.13);
--glass: rgba(230,237,243,0.02);
--green: #3FB950;
--blue: #58A6FF;
--purple: #D2A8FF;
--red: #F85149;
```

### Shared Elements
- Grain overlay (SVG noise, opacity 0.025, fixed position)
- Header: 52px sticky, logo mark with accent border, Georgia serif app name, settings toggle
- Settings panel: collapsible, provider selector (OpenAI/Anthropic), API key input with status indicator, app-specific context fields
- Generate button: accent background, black or white text, full width, lift + shadow on hover
- Output cards: bg2 background, 1px border, 12-14px border-radius, section headers in bg3
- Copy buttons on every output section
- Loading state: spinner in accent color + descriptive text
- Error state: red-tinted background with message

### PostMessage Bridge (include in every app before </body>)
```html
<script>
(function(){
  window.addEventListener('message',function(e){
    if(e.data&&e.data.type==='salesai-key-delivery'){
      if(e.data.key&&e.data.provider){
        var pe=document.getElementById('provider');if(pe)pe.value=e.data.provider;
        var ke=document.getElementById('apiKey');if(ke)ke.value=e.data.key;
        if(typeof saveSettings==='function')saveSettings();
        if(typeof updateKeyStatus==='function')updateKeyStatus();
      }
    }
  });
  if(window.parent!==window){
    window.parent.postMessage({type:'salesai-key-request',provider:'openai'},'*');
    setTimeout(function(){window.parent.postMessage({type:'salesai-key-request',provider:'anthropic'},'*');},100);
  }
})();
</script>
```

### AI Call Pattern (both providers)
```javascript
async function callAI(prompt, system) {
  const provider = document.getElementById('provider').value;
  const key = document.getElementById('apiKey').value;
  if (!key) throw new Error('Please add your API key in Settings.');

  if (provider === 'openai') {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [{ role: 'system', content: system }, { role: 'user', content: prompt }],
        temperature: 0.7,  // adjust per app
        max_tokens: 3000
      })
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || 'API error'); }
    return (await r.json()).choices[0].message.content;
  } else {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: system,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error(e.error?.message || 'API error'); }
    return (await r.json()).content[0].text;
  }
}
```

All AI responses should be requested as raw JSON (no markdown, no backticks). Parse with try/catch and a regex fallback for `/{[\s\S]*}/` or `/\[[\s\S]*\]/`.

---

## APP 4: Contact Enricher
**Accent:** `#38BDF8` (Electric Sky Blue)
**Concept:** Paste what you know about a contact → get a structured profile card with email prediction, org chart inference, talking points, and a recommended outreach sequence.

### What's New vs. Original
- **Multi-contact mode** — paste up to 10 contacts, get a profile card for each
- **Buying committee mapper** — enter multiple people at one company, AI maps who is the champion, economic buyer, technical evaluator, blocker
- **Outreach sequence starter** — not just talking points, but a 2-email mini-sequence personalized to each contact
- **Confidence scoring** — every data point gets a confidence tag (high/medium/low/inferred) so the rep knows what to verify

### Settings Fields
- Provider, API key (standard)
- Your product/service
- Your name/title (for the outreach sequence)

### Input Modes (tabs)
1. **Single Contact** — free text: name + company + anything else known
2. **Buying Committee** — paste multiple contacts at one company, AI maps roles
3. **Bulk Enrichment** — one contact per line, batch processing

### AI System Prompt (temperature: 0.3)
```
You are a sales intelligence researcher. Given partial contact information, build a complete profile with outreach recommendations.

Respond in exact JSON:
{
  "name": "Full Name",
  "title": "Current Title",
  "company": "Company Name",
  "email_prediction": { "email": "first.last@company.com", "confidence": "high|medium|low", "method": "Standard corporate pattern" },
  "phone": "Requires enrichment API",
  "linkedin_url": "Likely URL or 'Unknown'",
  "department": "Sales|Marketing|Engineering|etc",
  "seniority": "C-Suite|VP|Director|Manager|IC",
  "location": "City, State/Country or 'Unknown'",
  "reports_to": "Likely title they report to",
  "background": "2-3 sentence career summary if inferable",
  "buying_role": "Champion|Economic Buyer|Technical Evaluator|Influencer|Blocker|Unknown",
  "talking_points": ["3 personalization hooks based on their background"],
  "outreach_sequence": {
    "email_1_subject": "Subject line",
    "email_1_body": "Short personalized first touch (3-4 sentences)",
    "email_2_subject": "Follow-up subject",
    "email_2_body": "Value-add follow-up (3-4 sentences)"
  },
  "best_channel": "LinkedIn|Email|Phone — with reasoning"
}

Rules:
- Only use information provided or clearly inferable. Don't fabricate specifics.
- Mark confidence levels honestly on every data point
- Email predictions should follow common corporate patterns (first.last, firstl, first)
- Buying role inference based on title + seniority
```

### Buying Committee Mode Prompt Addition
```
When given multiple contacts at one company, map each to a buying role and show:
{
  "company": "...",
  "committee": [
    { ...contact profile..., "buying_role": "Champion", "role_confidence": "high", "engagement_priority": 1 }
  ],
  "gaps": ["No economic buyer identified", "Missing technical evaluator"],
  "recommendation": "Who to engage first and why"
}
```

### UI Output
- **Contact card** with gradient header (accent color) showing name, title, company
- **Grid of fields** with confidence badges (high=green, medium=yellow, low=red)
- **Talking points** as bullet list
- **Mini outreach sequence** with copy buttons per email
- **Buying committee view** (if multiple contacts): visual role map with priority numbers

---

## APP 5: Cold Email Writer
**Accent:** `#F472B6` (Hot Pink)
**Concept:** Enter prospect info → get a complete multi-email outbound sequence with A/B variants, personalization, and send timing.

### What's New vs. Original
- **A/B variant generation** — each email in the sequence gets 2 variants (different angles/hooks)
- **Sequence timeline** — visual timeline showing recommended send days with spacing
- **Performance predictions** — AI rates each email's likely open rate and reply rate based on subject line and approach
- **Follow-up chain awareness** — each email references the previous one naturally, not as "bumping this"
- **Personalization depth selector** — light (name + company), medium (+ role + industry), deep (+ trigger event + mutual connections + recent activity)

### Settings Fields
- Provider, API key
- Your product, value prop
- Sender name/title
- Company name (for the "from" context)

### Input
- **Prospect details** — free text: name, title, company, industry, any intel
- **Personalization depth** — Light / Medium / Deep (select)
- **Sequence length** — 3 / 4 / 5 emails (select)
- **Tone** — Professional / Casual / Provocative / Empathetic (select)
- **CTA style** — Book a meeting / Soft reply / Offer value first / Ask for referral (select)
- **Trigger event** (optional) — what's the "why now" moment

### AI System Prompt (temperature: 0.8)
```
You are an elite cold email copywriter. Generate a multi-email outbound sequence that sounds authentically human.

Context: Product: {product}, Value prop: {value}, Sender: {sender}
Personalization depth: {depth}
Trigger event: {trigger}

Respond in exact JSON:
{
  "sequence": [
    {
      "position": "Email 1 — Initial Outreach",
      "send_day": "Day 1",
      "variant_a": {
        "subject": "Subject line A (under 8 words)",
        "body": "Email body",
        "approach": "1-word label: Curiosity|Value|Pain|Social|Direct"
      },
      "variant_b": {
        "subject": "Subject line B (different angle)",
        "body": "Email body with different hook",
        "approach": "1-word label"
      },
      "predicted_open_rate": "35%",
      "predicted_reply_rate": "4%",
      "key_personalization": "What specific detail from the prospect was used"
    }
  ],
  "sequence_strategy": "2-sentence explanation of the overall sequence arc",
  "best_send_times": "Recommended days/times to send based on B2B benchmarks"
}

Rules:
- NO "I hope this finds you well" or "I wanted to reach out"
- Each email uses a DIFFERENT angle (not just "following up")
- Last email should be a creative breakup
- Under 100 words per email — shorter is better
- Each variant must use a genuinely different hook, not just rephrased
- Reference something SPECIFIC about the prospect in every email
- If personalization depth is "deep", include trigger events, mutual connections, or recent activity
```

### UI Output
- **Sequence timeline** — horizontal visual: Day 1 → Day 3 → Day 7 → Day 14 → Day 21
- **Email cards** — each shows both A/B variants side by side with tabs
- **Performance predictions** on each card (open rate, reply rate in small badges)
- **Copy buttons** per variant
- **"Copy full sequence"** button that exports all variant A emails as one block

---

## APP 6: LinkedIn Message Crafter
**Accent:** `#0EA5E9` (LinkedIn Blue — adjusted slightly to not be identical to actual LinkedIn)
**Concept:** Paste LinkedIn profile → get message variants that feel human, with character counts enforced and strategy coaching.

### What's New vs. Original
- **Profile parser** — smarter extraction of headline, experience, posts, mutual connections
- **Message types expanded** — Connection request, InMail, Follow-up after connect, Follow-up after no response, Referral ask, Event-based outreach
- **Voice note script** — generates a 20-30 second voice note script (LinkedIn voice messages have high reply rates)
- **"What NOT to say" coaching** — anti-patterns specific to this persona/situation

### Settings Fields
- Provider, API key
- Your product
- Your name/title

### Input
- **Profile info** — free text (paste from LinkedIn)
- **Message type** — Connection (300 char) / InMail (1900 char) / Follow-up / Voice note script / Referral ask (select)
- **Tone** — Peer-to-peer / Curious / Direct / Warm (select)
- **Context** (optional) — any additional context: mutual connection, shared event, their recent post

### AI System Prompt (temperature: 0.8)
```
You are a LinkedIn outreach specialist. Generate messages that feel like genuine human connections, not sales automation.

Context: Sender is {sender} selling {product}.
Message type: {type} (char limit: {limit})
Tone: {tone}

Respond in exact JSON:
{
  "profile_insights": {
    "key_hooks": ["3 things from their profile worth referencing"],
    "shared_ground": "Any mutual connections, experiences, or interests",
    "recent_activity": "Recent posts or activity worth mentioning"
  },
  "messages": [
    {
      "label": "Variant A — [2-word strategy]",
      "message": "The message text",
      "char_count": 142,
      "strategy_note": "Why this angle works for this person",
      "hook_used": "Which profile element was leveraged"
    }
  ],
  "voice_note_script": "20-30 second spoken script if voice note type selected",
  "avoid": ["2-3 things NOT to say to this specific person and why"]
}

Generate 3 message variants. Rules:
- STRICT character limits: Connection=300, InMail=1900
- Each variant uses a DIFFERENT personalization hook
- Never start with "Hi [Name], I noticed..." — too generic
- No "I'd love to pick your brain" or "I'd love to connect"
- End with something that invites natural reply
- Voice note script should sound conversational, not read-from-paper
```

### UI Output
- **Profile Insights** panel at top (key hooks, shared ground, recent activity)
- **3 message cards** — each with character counter (green under limit, yellow within 10%, red over), strategy note, copy button
- **Voice note card** (if selected) — with estimated duration and copy button
- **"What to avoid" section** — red-bordered warnings

---

## APP 7: Commission Calculator
**Accent:** `#10B981` (Money Green)
**Concept:** Configure your comp plan → instantly model commission on any deal with what-if scenarios. AI interprets comp plan documents.

### What's New vs. Original
- **Visual deal modeler** — interactive sliders for deal size, discount, and multi-year, with real-time commission recalculation
- **Quarter tracker** — input YTD bookings, see where you stand vs quota with projected earnings at current pace
- **Multiple comp plan profiles** — save different plans (different roles, different periods) and switch between them
- **Deal comparison mode** — model 2-3 deals side by side to see which to prioritize based on commission impact
- **AI plan interpreter** — paste your comp plan document, AI extracts all parameters automatically

### Settings Fields
- Provider, API key (only needed for AI interpreter)

### Core Calculator (NO AI needed — pure JavaScript math)
```
Inputs:
- Annual quota ($)
- Base commission rate (%)
- Accelerator threshold (% of quota)
- Accelerator rate (%)
- Decelerator threshold (% of quota, optional)
- Decelerator rate (% — lower than base, optional)
- Current YTD bookings ($)
- Deal value ($)
- Discount applied (%)
- Multi-year multiplier (1x / 1.1x / 1.2x)
- SPIFs ($ flat bonus, optional)

Outputs:
- Commission on this deal ($)
- Effective rate on this deal (%)
- New YTD after this deal ($)
- Quota attainment after this deal (%)
- Remaining to quota ($)
- Projected annual earnings at current pace ($)
```

### AI Interpreter Prompt (temperature: 0.2)
```
Extract compensation plan parameters from this text. Return exact JSON:
{
  "quota": 1000000,
  "base_rate": 10,
  "accelerator_threshold": 100,
  "accelerator_rate": 15,
  "decelerator_threshold": 50,
  "decelerator_rate": 5,
  "spifs": [{"name": "New Logo Bonus", "amount": 2000, "condition": "Per new logo"}],
  "multi_year_multipliers": {"2_year": 1.1, "3_year": 1.2},
  "notes": "Anything else relevant that the calculator doesn't handle"
}
All numbers should be raw values (10 for 10%, not 0.10). If something isn't specified, use null.
```

### UI Layout
- **Plan configuration panel** (collapsible, saved to localStorage)
- **Deal input section** with sliders that update in real-time
- **Results dashboard** — 4 stat cards (commission, attainment, remaining, projected annual)
- **Breakdown table** — shows calculation steps
- **What-if slider** — drag to change deal size, commission updates live
- **Quarter tracker bar** — visual progress bar showing YTD vs quota
- **AI interpreter** — separate tab: paste comp plan text, button to extract and auto-fill

---

## APP 8: Email-to-CRM Logger
**Accent:** `#818CF8` (Soft Indigo)
**Concept:** Paste email thread → get structured CRM activity record with deal intelligence, sentiment, and auto-categorization.

### What's New vs. Original
- **Thread intelligence** — not just a summary, but analysis: who's driving the deal, who's blocking, what commitments were made
- **Multi-thread intake** — paste multiple separate threads, AI connects them into one deal narrative
- **Auto-tagging** — automatically tags the activity: New Opportunity, Negotiation, Technical Evaluation, Procurement, etc.
- **Forwarding context strip** — removes forwarding headers, disclaimers, and signatures to clean up before processing
- **Commitment tracker** — extracts every "I'll send you...", "Let's schedule...", "We need to..." and lists them as trackable items

### Settings Fields
- Provider, API key
- CRM platform (Salesforce/HubSpot/Generic)

### AI System Prompt (temperature: 0.2)
```
You parse email threads into structured CRM activity records with deal intelligence.

CRM: {crm_platform}

Respond in exact JSON:
{
  "activity": {
    "type": "Email Thread",
    "direction": "Inbound|Outbound|Bidirectional",
    "date": "Most recent email date",
    "subject": "Thread subject",
    "from": "Primary sender name + email",
    "to": "Recipients",
    "related_account": "Company name",
    "auto_tag": "Discovery|Demo Follow-up|Negotiation|Technical|Procurement|Renewal|Other"
  },
  "summary": "2-3 sentence executive summary",
  "key_points": "• Bullet list of important details",
  "commitments": [
    { "who": "Name", "what": "What they committed to", "by_when": "Date or 'Not specified'", "status": "pending" }
  ],
  "deal_intelligence": {
    "buying_signals": ["Specific positive indicators"],
    "concerns": ["What the prospect is worried about"],
    "competitors_mentioned": ["Any competitor names"],
    "next_steps": "What should happen next",
    "deal_stage_indicator": "Early|Mid|Late|At Risk"
  },
  "sentiment": {
    "score": 68,
    "label": "Interested but needs internal buy-in",
    "tone_shift": "Describe how tone changed across the thread (if multi-message)"
  },
  "crm_formatted": "Full activity description formatted for {crm_platform} paste"
}
```

### UI Output
- **Activity header** — type, direction, date, auto-tag badge
- **Summary section** with copy button
- **Commitments tracker** — table with who/what/when/status columns
- **Deal intelligence panel** — buying signals (green), concerns (yellow), competitors (red), stage indicator
- **Sentiment meter** — score + label + tone shift narrative
- **CRM-formatted output** — ready to paste into Salesforce/HubSpot, with copy button

---

## APP 9: Account Briefing Builder
**Accent:** `#EC4899` (Hot Rose)
**Concept:** Paste company info → get a comprehensive pre-meeting briefing with talk tracks, competitive positioning, and risk assessment.

### What's New vs. Original
- **Meeting-specific mode** — tell it WHO you're meeting and the purpose, get targeted talk tracks for that specific conversation
- **Competitive positioning section** — if competitors are detected, get specific positioning angles
- **Risk radar** — visual assessment of deal risks: single-threaded, no champion, competitor entrenched, budget frozen, etc.
- **Key questions to ask** — based on the briefing, what are the 5 most important questions for this meeting
- **One-page PDF export format** — structured so it can be printed or shared as a one-pager

### Settings Fields
- Provider, API key
- Your product
- Key differentiators
- Main competitors (comma-separated)

### Input
- **Company info** — free text (paste from website, LinkedIn, Crunchbase, etc.)
- **Meeting context** — who are you meeting, their role, meeting purpose
- **What you already know** (optional) — any prior deal context, previous meetings

### AI System Prompt (temperature: 0.3)
```
You create comprehensive account briefings for sales meetings.

Our product: {product}
Differentiators: {differentiators}
Our competitors: {competitors}
Meeting context: {meeting_context}

Respond in exact JSON:
{
  "company": {
    "name": "...",
    "tagline": "One-line description",
    "industry": "...",
    "founded": "...",
    "hq": "...",
    "employees": "...",
    "revenue": "...",
    "funding": "..."
  },
  "overview": "3-4 paragraph company narrative",
  "key_people": [
    { "name": "...", "title": "...", "relevance": "Why they matter to your deal", "talking_point": "Something specific to mention" }
  ],
  "competitive_landscape": {
    "competitors_detected": ["names"],
    "our_advantages": ["3 specific advantages vs. detected competitors"],
    "landmines": ["Questions or topics to avoid that favor competitors"],
    "positioning_statement": "How to position against their current/likely solution"
  },
  "risk_radar": [
    { "risk": "Single-threaded", "level": "high|medium|low", "mitigation": "What to do about it" }
  ],
  "talk_tracks": [
    { "topic": "Opening / rapport", "what_to_say": "...", "why": "..." },
    { "topic": "Pain discovery", "what_to_say": "...", "why": "..." },
    { "topic": "Value positioning", "what_to_say": "...", "why": "..." }
  ],
  "key_questions": ["5 most important questions to ask in this meeting"],
  "recent_news": "Any recent developments worth mentioning",
  "tech_stack": ["Known or likely technologies"]
}
```

### UI Output
- **Company header** — name, tagline, key facts row (industry, size, HQ, funding)
- **Overview section** — narrative text
- **Key People cards** — name, title, relevance, talking point per person
- **Competitive Positioning panel** — advantages, landmines, positioning statement
- **Risk Radar** — visual risk items with high/medium/low color coding and mitigation
- **Talk Tracks** — ordered cards with topic, script, and reasoning
- **Key Questions** — numbered list
- **Tech Stack tags** — pill badges
- **"Copy full briefing" button** — exports everything as structured text

---

## APP 10: Discovery Question Generator
**Accent:** `#F59E0B` (Warm Amber)
**Concept:** Select industry + persona + stage → get categorized discovery questions with coaching on why to ask each one and what to listen for.

### What's New vs. Original
- **Conversation flow mode** — not just a list of questions, but a suggested conversation arc: opening → pain → impact → process → timeline → close
- **Adaptive depth** — if the rep marks a question as "answered" or "skipped", the AI adjusts remaining questions
- **Objection anticipation** — for each question, shows likely objections/deflections and how to handle them
- **Framework toggle** — switch between MEDDIC, SPIN, Challenger, Sandler, and Custom, each generates framework-specific questions
- **Meeting prep checklist** — before the meeting, a checklist of what to prepare (case studies, ROI data, demo environment, etc.)

### Settings Fields
- Provider, API key
- Your product
- Sales methodology (MEDDIC/SPIN/Challenger/Sandler/Custom)
- Custom playbook (optional textarea for team-specific questions)

### Input
- **Industry** — SaaS, Fintech, Healthcare, E-commerce, Manufacturing, Media, Education, Other (select)
- **Buyer persona** — CRO/VP Sales, CMO/VP Marketing, CTO/VP Engineering, CFO/VP Finance, COO/VP Ops, IT/Security, General (select)
- **Deal stage** — First Meeting, Deep Discovery, Evaluation, Proposal (select)
- **Additional context** (optional) — account-specific info like "they mentioned data migration concerns"

### AI System Prompt (temperature: 0.7)
```
You are an elite sales coach. Generate a structured discovery conversation plan.

Product: {product}
Methodology: {methodology}
Custom playbook: {playbook}

Respond in exact JSON:
{
  "conversation_arc": [
    {
      "phase": "Opening & Rapport",
      "duration": "2-3 minutes",
      "questions": [
        {
          "question": "The actual question to ask",
          "why_ask": "What intelligence this gathers",
          "listen_for": "Specific signals in their answer",
          "if_they_deflect": "How to handle a non-answer",
          "framework_tag": "MEDDIC: Identify Pain"
        }
      ]
    },
    {
      "phase": "Current State & Pain",
      "duration": "8-10 minutes",
      "questions": [...]
    },
    {
      "phase": "Impact & Metrics",
      "questions": [...]
    },
    {
      "phase": "Decision Process & Timeline",
      "questions": [...]
    },
    {
      "phase": "Next Steps & Close",
      "questions": [...]
    }
  ],
  "meeting_prep": [
    "Have a case study ready for their industry",
    "Prepare ROI calculator with their company size",
    "..."
  ],
  "total_questions": 14,
  "estimated_duration": "30-35 minutes"
}

Rules:
- Generate 12-16 questions organized into a natural conversation flow
- Questions must be open-ended, never yes/no
- Tailor to industry + persona + deal stage
- Each question must have coaching on deflection handling
- Tag each question with the methodology framework element it maps to
- The conversation should flow naturally — not feel like an interrogation
```

### UI Output
- **Conversation arc** — expandable phase sections with duration estimates
- **Question cards** within each phase: question text (bold), "Why ask" (text2), "Listen for" (green text), "If they deflect" (amber text), framework tag (pill badge)
- **Meeting prep checklist** — checkboxes the rep can tick off
- **Summary bar** — total questions, estimated duration, framework coverage percentage
- **"Copy all questions"** — exports as numbered list with coaching notes

---

## ACCENT COLOR SUMMARY

| App | Name | Accent | Hex |
|-----|------|--------|-----|
| 1 | Objection Response Generator | Warm Copper | #E8976C |
| 2 | CRM Note Summarizer | Soft Green | #4ADE80 |
| 3 | ICP Match Scorer | Amber | #FBBF24 |
| 4 | Contact Enricher | Electric Sky | #38BDF8 |
| 5 | Cold Email Writer | Hot Pink | #F472B6 |
| 6 | LinkedIn Message Crafter | LinkedIn Blue | #0EA5E9 |
| 7 | Commission Calculator | Money Green | #10B981 |
| 8 | Email-to-CRM Logger | Soft Indigo | #818CF8 |
| 9 | Account Briefing Builder | Hot Rose | #EC4899 |
| 10 | Discovery Question Generator | Warm Amber | #F59E0B |

---

## BUILD NOTES

1. **Each app is a single self-contained HTML file.** All CSS and JS inline. No external dependencies except Google Fonts (JetBrains Mono) and the two AI API endpoints.

2. **localStorage key naming convention:** `salesai_{appslug}` for settings (e.g., `salesai_contact_enricher`, `salesai_cold_email`). Prevents collisions between apps.

3. **All apps must have `id="provider"` and `id="apiKey"`** — the marketplace postMessage bridge targets these specific IDs.

4. **All apps must have `saveSettings()` and `updateKeyStatus()` functions** — the bridge calls these after delivering the key.

5. **Temperature varies by app:** Low (0.2-0.3) for analytical/structured output (CRM summarizer, ICP scorer, email logger). High (0.7-0.8) for creative output (cold email, LinkedIn, objection response, discovery questions).

6. **Test each app standalone** (open the HTML file directly in a browser) AND inside the marketplace iframe. Both paths must work — settings panel for standalone, postMessage bridge for iframe.

7. **Every output section needs a copy button.** This is non-negotiable — the entire value prop is speed, and copy-to-clipboard is the last-mile delivery mechanism.
