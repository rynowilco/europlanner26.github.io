# Euro Planner '26 — Developer Handoff Brief v2
*Updated: March 2026 | Session 2 complete | Prepared for incoming Claude dev instance*

---

## 👋 Note to Incoming Claude

Welcome to Euro Planner '26. This is a meaningful project — a real family is actively using it to plan a 3-week Europe trip departing Summer 2026. Real data is in play. Treat it accordingly.

**About the user (Ryan):** Ryan is the dad — smart, engaged, and comfortable following detailed technical instructions. He is not a programmer. He will not be writing code himself. Your job is to make changes, explain what you did, and flag decisions that need his input. Be collaborative on significant UX/architecture decisions (present options A/B/C). Handle minor implementation details on your own. Skip deployment instructions — he knows to push to GitHub and hard refresh.

**Before starting any task:** Read this brief fully. Then ask clarifying questions. It is far better to ask one good question upfront than to build the wrong thing. Ryan appreciates this.

**Working style that has worked well:**
- Deliver updated files with brief summaries of what changed
- Use Python scripts for complex multi-location code replacements (see Gotchas section for a critical caveat)
- Verify patch success with grep/line number checks before shipping
- Keep a running mental model of the feature state — don't re-implement things that are already done

---

## Project Overview

Euro Planner '26 (EP26) is a mobile-first family trip planning app. Features:
- AI chat assistant (Claude) that guides activity discovery per user
- Activity submission → parent approval workflow
- Saved Ideas for bookmarking without submitting
- Google Sheets sync for activities, conversations, booking list
- Email notifications to parents via EmailJS
- Interactive trip map with city popups and route visualization
- Session management with resume prompts
- Parent admin mode (password-gated) with approval/feedback workflow
- Booking checklist (admin only) for tracking reservations

**Live URL:** `https://rynowilco.github.io/europlanner26.github.io/`
**Repository:** `https://github.com/rynowilco/europlanner26.github.io`
**Current live file:** `index.html` (currently at feature parity with v10 from this session)

---

## Technical Architecture

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | Single-file React app with Babel (`index.html`) | No build step — Babel transpiles JSX in browser |
| Hosting | GitHub Pages | **Migration to Vercel planned — see Roadmap** |
| AI Backend | Claude API via Cloudflare Worker proxy | `https://europlanner-api.wilcoxson-ryan.workers.dev` |
| Database | Google Sheets | 7 tabs — see Sheets Structure below |
| Auth | Google OAuth (device-level, token expires hourly) | **Migration to service account planned — see Roadmap** |
| Email | EmailJS | Parent notifications on activity submission |
| Maps | Leaflet.js with CartoDB Positron tiles | Clean minimal tile style |
| Markdown | marked.js | All Claude responses rendered as markdown |

### ⚠️ Critical Security Rule
**NEVER put the Claude API key in the frontend code.** Anthropic auto-revokes keys committed to public repos. The API key is stored exclusively as a secret in Cloudflare Worker environment variables. The Worker acts as a secure proxy — the frontend calls the Worker URL, the Worker adds the key and calls Claude.

### Cloudflare Worker
The Worker currently:
- Accepts POST from frontend
- Injects `web_search_20250305` tool into every Claude API call
- Adds `anthropic-beta: web-search-2025-03-05` header
- Returns Claude's full response to frontend

Web search is live and working. Claude uses it automatically when it needs current prices, booking links, or opening hours.

---

## User Profiles

| Name | Age | ID | Emoji | Role | Notes |
|------|-----|-----|-------|------|-------|
| Abby | 11 | `abby` | ⚽ | Kid | Shopping, food experiences, new activities. Avoids long hikes and car rides. |
| Tyler | 14 | `tyler` | 🏈 | Kid | Sports, food, learning about places, family bonding. Avoids long car rides. |
| Ryan | 50 | `ryan` | 👨‍🍳 | Parent | Dad. Seafood obsessed (sardines, anchovies). Hiking, fish markets, culture. |
| Mom | 48 | `mom` | 🧜‍♀️ | Parent | Mom. Water obsessed — swimming, lakes, rivers, waterfalls. Hiking and culture. |

**Parent flag:** `isParent: true` in `CONFIG.users`. Also set in `parseUserProfiles()`. Both locations need updating if roles change.

**Admin password:** `sardine`

**Parent UX:** Ryan and Mom have a distinct chat experience:
- Opening message is a live family status card (Abby/Tyler activity counts, deadline countdown)
- Different chip set (Family Status, Trip Logistics, What Still Needs Booking, etc.)
- Different system prompt (coordinator role, full family visibility, adult tone)
- Resume prompt is skipped — parents always see fresh status card on entry
- Admin (password gate) remains separate — being a parent user doesn't auto-grant admin

---

## Google Sheets Structure

**Spreadsheet ID:** `12ca-wAeLKrmfgdJQmxKjRFNAvptjdnJCobSkm1wk838`

| Tab Name | Purpose |
|----------|---------|
| `Activity Proposals` | All submitted/approved activities |
| `User Profiles` | Per-user budget, stats |
| `Itinerary` | Trip cities, dates, transport |
| `Conversation Memory` | Per-session chat summaries |
| `Language Phrases` | Phrases for language learning feature |
| `Soft Parameters` | Configurable app parameters |
| `Booking List` | Mom's booking checklist *(new — must be created manually in the Sheet if not done yet)* |

**Activity Proposals row format (columns A-N):**
`id, kidName, title, city, description, estimatedCost, travelMethod, travelTime, duration, otherConsiderations, status, dateSubmitted, parentFeedback, dateUpdated`

**Booking List row format (columns A-I):**
`id, title, city, notes, link, status, dateAdded, dateBooked, activityId`

---

## Key localStorage Keys

| Key | Contents |
|-----|---------|
| `euroPlanner_activities` | Cached activities (includes `syncedToSheets` flag) |
| `euroPlanner_savedIdeas` | Saved ideas list |
| `euroPlanner_sessionSummaries` | Per-user session summaries |
| `euroPlanner_lastActivity` | Timestamps for idle detection |
| `euroPlanner_bookingItems` | Booking checklist items |
| `euroPlanner_profiles` | User profile cache |
| `google_access_token` / `google_token_expiry` | OAuth tokens (being phased out in Vercel migration) |

---

## Agent Structured Output Blocks

Claude outputs special tagged blocks that the app parses client-side. These blocks are stripped from the displayed chat text — the user never sees the raw block syntax.

### Save Idea
```
[SAVE_IDEA]
Title: Rhine Falls Visit
City: Basel
Notes: Europe's biggest waterfall
Cost: 20
[/SAVE_IDEA]
```

### Submit Activity (triggers confirmation card UI)
```
[SUBMIT_ACTIVITY]
Title: Gelato Making Workshop
City: Florence
Description: Learn to make authentic Italian gelato...
Cost: 65
Travel Method: Walking
Travel Time: 15 minutes
Duration: 2 hours
Considerations: Book 2 days ahead...
ConflictNote: Optional — only included if a genuine conflict exists. Max 20 words.
[/SUBMIT_ACTIVITY]
```

**City field rule (enforced in system prompt):** Claude must use the exact canonical city name from the itinerary — no qualifiers like "(Transfer Day)", "Near", "- Day Trip". The map uses fuzzy matching as a safety net (checks if either string contains the other), but clean city names are preferred.

### Add Booking Item (silently adds to booking checklist)
```
[ADD_BOOKING]
Title: Arena di Verona Opera Tickets
City: Verona
Notes: Sells out months ahead in summer. Book by April.
Link: https://www.arena.it
[/ADD_BOOKING]
```

---

## Currently Working Features ✅

- Claude chat via Cloudflare Worker proxy
- **Web search** — Claude fetches live prices, links, and hours (Cloudflare Worker injects tool)
- Activity confirmation card (Submit for Review / Keep Planning)
- **Conflict detection** — Claude flags scheduling, budget, logistics, and duplication conflicts; amber warning shown on confirmation card and admin activity cards
- Saved Ideas with Refine/Submit/Delete
- Google Sheets sync (activities + conversation memory + booking items)
- Email notifications (one per parent on activity submission)
- Transfer days positioned dynamically on map
- Session management with resume prompts (kids); status card always shown (parents)
- Parent admin mode (password: `sardine`) with approval/feedback workflow
- **Booking checklist** (admin only) — auto-populated by Claude via `[ADD_BOOKING]` blocks + manual "+ Add" button; To Book / Booked sections; syncs to Sheets
- **Interactive map** — CartoDB Positron tiles, auto-fit bounds, red dashed route line, city popups with activity list (status badges, emoji, cost), date range labels on city markers, small dots for approved activities
- **Fuzzy city matching** on map popup — "Basel (Transfer Day)" correctly matches Basel marker
- **All markdown links open in new tab** — custom marked.js renderer applied globally
- **Deadline countdown** on welcome screen (signed-in users) — progress bar, per-kid counts, color shifts green → amber → red as deadline approaches
- **Parent chat experience** — distinct opening message, system prompt, and chip set for Ryan and Mom
- **Duplicate activity prevention** — deduplicates by ID and by kidName+title combo before syncing to Sheets

---

## Known Issues / Technical Debt 🔲

### Google OAuth Fragility (Major — addressed in Vercel migration)
Tokens expire hourly, silently. When expired, Sheets writes fail without any user-visible error. Each device maintains its own token. This is the biggest reliability gap in the current app. Fully addressed by the Vercel + service account migration.

### Single-File Complexity
The entire app is one `index.html` (~2,750 lines as of v10). No build step, no modules. This is intentional for the current GitHub Pages setup but becomes unwieldy as features grow. The Vercel migration is the right time to introduce a proper project structure if desired — but confirm with Ryan before changing the architecture, as he deploys manually.

---

## Chat Prompt Chips

### Kids (Abby, Tyler)
| Label | Icon | Prompt |
|-------|------|--------|
| Give me Ideas | Sparkles | "Give me some activity ideas for this trip based on my interests!" |
| What's the Plan | Calendar | "What's the full trip plan? Walk me through the cities, transfer days, and dates." |
| My Activities | List | "Show me all the activities I have submitted or that have been approved so far." |
| All Activities | Users | "Show me all approved activities for the whole family..." |
| What's the Story | BookOpen | "Tell me the story of our trip so far...as a fun narrative, not a list." |
| Trip Logistics | Map | "Help me think through how we get between cities — trains, travel times, what to book in advance." |

### Parents (Ryan, Mom)
| Label | Icon | Prompt |
|-------|------|--------|
| Family Status | Users | Full family status update — activities, approvals, budget, what needs attention |
| What's the Plan | Calendar | Full trip plan walkthrough |
| All Activities | List | All submitted and approved activities across family |
| Trip Logistics | Map | Logistics, trains, advance booking, transfer day plans |
| Booking List | Book | What still needs booking; check flagged items and suggest additions |
| What's the Story | BookOpen | Fun narrative of the trip so far |

---

## System Prompt Architecture

`generateSystemPrompt(user, userId, activities, itinerary)` builds a context-aware prompt with these sections:

1. **Role & Scope** — what Claude helps with (parent version includes full trip coordination)
2. **Web Search** — instructions to use search for prices/links/hours
3. **Train & Transit Research** — confident use of training knowledge for European rail
4. **Tone & Style** — adult mode (parents) vs. age-appropriate (kids)
5. **Session Pacing** — kids get activity-submission nudges; parents get wrap-up suggestions
6. **Trip Details** — full itinerary from Sheets/CONFIG
7. **Transfer Days** — kids get "Kids Choice" framing; parents get logistics framing
8. **About the user** — interests, preferences, per-user notes
9. **Planning Status** — kids: budget + approved count + deadline; parents: family status snapshot
10. **Activity Guidelines** — budget, city field rule, user-specific preferences
11. **Activities So Far** — kids: own activities + family's; parents: all family activities
12. **Conflict Detection** — scheduling, budget, logistics, duplication checks; ConflictNote field
13. **Booking List** — when and how to output `[ADD_BOOKING]` blocks
14. **Saving Ideas** — when and how to output `[SAVE_IDEA]` blocks
15. **Language Learning** — weave in German/Italian/French naturally

---

## Roadmap

### Next Up: Vercel Migration + Service Account Auth
*(Estimated: 4–6 focused hours. Ryan wants to do this with fresh coffee — schedule as a dedicated session.)*

**Why it matters:** Current Google OAuth is fragile — tokens expire hourly, silent write failures, every device needs its own auth. Service account fixes all of this permanently.

**Migration steps (in order):**
1. Set up Vercel project, connect to GitHub repo
2. Create Google service account in Google Cloud Console
3. Share the Spreadsheet with the service account email
4. Add service account JSON credentials to Vercel environment variables
5. Write Vercel API routes for Sheets read/write (replacing client-side SheetsAPI calls)
6. Update frontend to call Vercel API routes instead of Google Sheets directly
7. Remove Google sign-in button and OAuth code from welcome screen
8. Test all Sheets operations (activities, booking items, conversation memory, profiles)
9. Implement device registration on profile select (device ↔ userId association)
10. Add Web Push notification support (Vercel server endpoint)
11. Build activity planning reminder notifications

**What this unlocks:**
- Reliable Sheets sync regardless of device or sign-in state
- Push notifications (kid submits activity → parent gets notified)
- Foundation for Phase 2 cron jobs (trip digest)
- Proper architecture for eventual SaaS path

**Before starting:** Ask Ryan to confirm the Vercel account exists and has the GitHub repo connected. Also confirm he has access to Google Cloud Console to create a service account. These are prerequisites that aren't code.

---

### Phase 2: Journal Mode (Build After Vercel Migration)

**Trigger:** App auto-flips to journal mode on departure date (Frankfurt arrival — check itinerary CONFIG).

**Welcome screen in journal mode:**
- "Today's Check-In" card showing current city and date based on itinerary
- Tapping opens chat in journal mode

**Journal system prompt (different from planning prompt):**
- Claude knows today's date, current city, what the family planned there
- Asks open-ended questions to draw out feelings, surprises, funny moments
- Saves responses to a `Journal` tab in Sheets: `user, date, city, lat, lng, entry, sessionId`

**Location capture:**
- `navigator.geolocation` on check-in, with graceful fallback if denied
- Attach lat/lng to journal entry row

**Photo upload:**
- Upload to Google Drive (within service account scope)
- Folder structure: `EP26 / [City] / [Date]`
- ⭐ Star toggle — starred photos pulled into trip digest
- Metadata: filename, userId, timestamp, city

### Trip Digest (Requires Vercel + Phase 2)
Every 2-3 days, a Vercel cron job:
1. Pulls recent journal entries from Sheets (since last digest)
2. Grabs starred photo links from Drive
3. Sends to Claude: write warm family narrative dispatch
4. EmailJS blasts to subscriber list

**Subscribe flow:** Shareable link `/follow/wilcoxson-europe-2026`, email input, server-side subscriber storage on Vercel.

**Digest tone:** Family narrator voice, warm and readable, individual personalities preserved.

### The Book
End goal: printed keepsake of the trip. Destinations = chapters (maps to itinerary). Each chapter has all 4 family members' entries interwoven chronologically + photos. Data is being structured for this from day one. Services like Artifact Uprising or Chatbooks can produce the physical book from organized data exports.

### Future: SaaS Path
The app is a strong candidate for a real product. No direct competitor for AI-powered family trip planning + journaling + keepsake + "follow our trip" digest. Fastest path to multi-family: Vercel migration (already planned) + user-defined trip config (instead of hardcoded itinerary) + proper auth (Firebase or similar) + per-family data isolation.

---

## Dev Notes & Gotchas

**⚠️ Python string replacement and template literals**
Previous sessions used Python scripts for multi-location code replacements. This works well, BUT: Python's `f-strings` and JavaScript template literals (`${...}`) conflict. If a JS string contains `${variable}`, Python will try to interpolate it. Always use regular Python strings (not f-strings) for JS replacement content, or escape the `$` as `\\$`. When in doubt, write the replacement as a Python string with explicit `+` concatenation for any JS that would otherwise use template literals.

**⚠️ Literal newlines in `.join()` calls**
In this session, a Python patch wrote `}).join('\n')` with a literal newline inside the string (Python interpreted `\n` as an actual newline in the output). Babel can't parse a JS string literal with a literal newline in it — the app fails silently with "Unterminated string constant". Always write `'\\n'` in Python when you want a literal `\n` in the output JS string.

**React stale closure pattern**
React state in `setTimeout`/`setInterval`/event listeners goes stale. The conversation memory system uses `messagesRef` and `sessionActivitiesRef` refs to solve this. Follow the same pattern for any new timer-based features that need to read current state.

**Single file, no build step**
Everything is in `index.html`. Babel transpiles JSX in the browser. No npm, no webpack, no bundler. Keep it this way until the Vercel migration. Don't suggest or introduce build tooling without confirming with Ryan.

**Duplicate activities**
The `syncedToSheets` flag was added mid-project. Pre-existing localStorage activities didn't have it. The current dedup logic checks by both activity `id` AND by `kidName + title` combo — this catches legacy activities without matching IDs. Don't remove the title+name fallback.

**Google OAuth tokens**
Stored in `google_access_token` and `google_token_expiry` in localStorage. Expire hourly. The whole OAuth system is being replaced by service account auth in the Vercel migration. Don't build new features on top of the OAuth layer.

**The `isParent` flag**
Set in two places: `CONFIG.users` object AND in `parseUserProfiles()` based on userId being `ryan` or `mom`. Both need updating if user roles change. The parent flag controls: system prompt branch, opening message type, chip set, and resume prompt behavior.

**Hard refresh required on GitHub Pages**
Users need `Cmd/Ctrl + Shift + R` to see updates after deploy. This is a GitHub Pages caching issue. The Vercel migration improves this with proper cache headers.

**Cloudflare Worker deployment**
Changes to the Worker (separate from the frontend) require logging into dash.cloudflare.com → Workers & Pages → europlanner-api → Edit Code → paste new code → click Deploy (not just Save). Ryan is familiar with this flow.

**Admin features are password-gated (not user-gated)**
Being Ryan or Mom does NOT automatically grant admin. Admin requires password `sardine`. This is intentional — Ryan confirmed he wants to keep the password gate.

---

## Config Reference

```javascript
CLOUDFLARE_WORKER: 'https://europlanner-api.wilcoxson-ryan.workers.dev'
SPREADSHEET_ID: '12ca-wAeLKrmfgdJQmxKjRFNAvptjdnJCobSkm1wk838'
GOOGLE_API_KEY: 'AIzaSyDcsv7an4O4p2XsaE-Dk6kHs3bmesTckfk'
GOOGLE_CLIENT_ID: '861097396300-0rl42agek0mfukvnp823aj7tn91da4od.apps.googleusercontent.com'
EMAILJS_SERVICE_ID: 'service_3uu6sr7'
EMAILJS_TEMPLATE_ID: 'template_q5foa71'
EMAILJS_PUBLIC_KEY: 'vp0WzqrRRXnzh_y58'
PARENT_EMAILS: ['katieheindel@gmail.com', 'talentonian@gmail.com']
ADMIN_PASSWORD: 'sardine'
CLAUDE_MODEL: 'claude-sonnet-4-20250514'
EUR_TO_USD_RATE: 1.08
ACTIVITY_DEADLINE: '2026-05-11'
REQUIRED_ACTIVITIES_PER_KID: 3
```

---

## Suggested Questions to Ask Ryan Before Starting

Before diving into any new session, consider asking:

1. **What's changed since last session?** Has Ryan tested the deployed version? Any broken features or unexpected behavior to address first?
2. **What's the priority?** Roadmap items, bug fixes, or something new that came up?
3. **Vercel migration readiness** — if that's on the agenda: does he have a Vercel account? Access to Google Cloud Console? A good block of time (4–6 hours)?
4. **For any UX change:** Does this affect the kids' experience, the parents' experience, or both? Is it visible to all users or admin-only?

---

*This brief covers EP26 as of early March 2026, following a full dev session that completed all immediate tasks from the v1 brief. The app is in active use. Good luck — it's a genuinely fun project.*
