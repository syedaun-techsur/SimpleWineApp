# User Journey Maps — SimpleWineApp

| Field | Value |
|---|---|
| **Product** | SimpleWineApp |
| **Version** | 1.0 |
| **Date** | 2026-06-05 |
| **Status** | Draft |
| **Related Personas** | PERSONAS-SimpleWineApp.md (PER-01, PER-02) |
| **Related JTBD** | JTBD-SimpleWineApp.md |
| **Related PRD** | PRD-SimpleWineApp.md |
| **Author** | Pivota Spec Journeys Generator |

---

## Journey Index

| JRN-ID | Persona | Scenario | Key JTBD(s) | Stages |
|---|---|---|---|---|
| JRN-01.1 | PER-01 Marcus Delgado | Adding a newly purchased wine at the shop | JTBD-01.1 | 5 |
| JRN-01.2 | PER-01 Marcus Delgado | Choosing what to drink tonight | JTBD-01.2 | 5 |
| JRN-01.3 | PER-01 Marcus Delgado | Logging a consumed bottle and saving a tasting note | JTBD-01.3 | 5 |
| JRN-02.1 | PER-02 Claire Fontaine | Finding which wines to hold vs. drink | JTBD-02.1, JTBD-02.2 | 6 |
| JRN-02.2 | PER-02 Claire Fontaine | Adding a structured tasting note for an aged bottle | JTBD-02.3 | 5 |
| JRN-02.3 | PER-02 Claire Fontaine | Managing storage locations and auditing bottle placement | JTBD-02.1, JTBD-02.4 | 5 |

---

## PER-01: Marcus Delgado — Casual Wine Drinker & Collector

---

### JRN-01.1: Adding a Newly Purchased Wine at the Shop

**Persona:** PER-01 (Marcus Delgado)

**Scenario:** Marcus is standing in a wine shop and has just picked up two bottles of a Côtes du Rhône he doesn't recognise but the staff recommended. His receipt is in hand, the label is in front of him, and he has maybe 60 seconds before his Uber arrives. He wants to log both bottles before the context evaporates and ends up in a camera-roll photo he'll never act on.

**Related Jobs:** JTBD-01.1

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Trigger** | Opens the app from his home screen while the cashier rings him up | App launch → `/` dashboard | "Let me get this in before I forget — I always mean to do it later and never do" | Slightly rushed, motivated | App might be slow to load and the moment passes | Sub-2-second load on `/`; persistent last-session state so he knows where he is |
| **Navigate** | Taps "Add Wine" button on the dashboard | `/` → `/wines/new` | "Okay, is the form going to be painful on this tiny screen?" | Cautiously hopeful | Previous tool (spreadsheet) required horizontal scroll; fear of that repeating | Prominent, thumb-reachable "Add Wine" CTA on dashboard; no horizontal scroll at 375px |
| **Enter Details** | Types wine name, producer, selects vintage from validated dropdown, sets type to Red, enters quantity 2 | `/wines/new` (F0) | "2022 — let me make sure the year doesn't autocomplete wrong… I always fat-finger years" | Focused, slightly anxious | Touch keyboard makes numeric fields error-prone; vintage typos likely | Inline vintage validation with range guard (1900–current+1); numeric field with large tap targets |
| **Assign Location** | Selects "Living Room Rack" from pre-populated location dropdown | `/wines/new` → location selector (F2) | "Good, my locations are already there — I don't have to type anything" | Relieved | If locations weren't saved, he'd skip this field and lose location context forever | Pre-populated location list from F2; required field enforced with a friendly inline nudge |
| **Save & Confirm** | Taps Save; sees the new wine appear in a success confirmation or navigates back to dashboard showing updated count | `/wines/new` → redirect to `/wines/[id]` or `/` (F0, F6) | "Done. Two bottles logged. I can relax now." | Relieved, satisfied | No visual confirmation of save = anxiety about whether it worked | Immediate redirect to wine detail or dashboard with a transient success banner; total bottle count tile updates |

---

#### Key Moments

- **Decision Point — Navigate stage:** If the "Add Wine" button isn't immediately visible on the dashboard, Marcus will close the app and take a photo instead. The CTA must be in the primary thumb zone.
- **Risk of Abandonment — Enter Details stage:** Any form field that requires horizontal scrolling or has a broken mobile keyboard experience causes immediate drop-off. The vintage field is the single highest-risk input.
- **Delight Opportunity — Save & Confirm stage:** Showing an updated "Total Bottles: 47" stat tile after save gives Marcus an instant, tactile sense that the record is real.

#### Success Outcome

Marcus creates a complete wine record (name, producer, vintage, type, quantity, location) in under 90 seconds on a 375px screen with no horizontal scroll at any step. *(JTBD-01.1 success measure)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Trigger | F6 (Dashboard) |
| Navigate | F6 (Dashboard CTA) |
| Enter Details | F0 (Wine CRUD form) |
| Assign Location | F2 (Storage Locations selector) |
| Save & Confirm | F0 (persist), F6 (stat tile update) |

---

### JRN-01.2: Choosing What to Drink Tonight

**Persona:** PER-01 (Marcus Delgado)

**Scenario:** It's 6:30 pm on a Thursday. Marcus is cooking pasta and wants to open something nice without overthinking it. He doesn't remember exactly what's in the rack and doesn't want to walk to the living room and physically read labels. He opens the app expecting to see something useful immediately.

**Related Jobs:** JTBD-01.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Open App** | Unlocks phone and taps the app icon | App launch → `/` dashboard (F6) | "What do I have that's ready to open?" | Casually curious, slightly impatient | If the app lands on a blank or loading state he loses interest immediately | Dashboard as default route; render within 1s on warm container; no loading skeleton visible for >500ms |
| **Scan Dashboard** | Eyes go to the "Drink Now" shelf and the Drink Now stat tile | `/` → Drink Now shelf (F5, F6) | "Oh, 6 bottles ready — which ones?" | Engaged, pleasantly surprised | Dashboard cluttered with information he doesn't need right now obscures the drink-now signal | Drink Now count tile prominently placed above the fold; "Drink Now" shelf immediately below; no scroll needed to see first 2–3 cards |
| **Browse Candidates** | Scrolls the horizontal Drink Now shelf to scan wine names and types | `/` Drink Now shelf (F5, F6) | "The Rioja or the Grenache? Which did I rate higher last time?" | Curious, lightly indecisive | No rating visible on shelf cards = can't compare without opening each one | Show most-recent star rating on each Drink Now card; single-line producer + name legible at card width |
| **Select a Wine** | Taps a card to open the wine detail page | `/` → `/wines/[id]` (F0, F4) | "Let me check if I have a tasting note — oh, I gave this 4 stars last time, that's the one" | Confident | Detail page is slow to load or buries the rating below a long description | Rating displayed in the top section of detail page; prior tasting notes visible without scrolling |
| **Decide & Act** | Closes app, walks to the rack to retrieve the bottle | App closed | "Perfect, I know exactly what I'm getting" | Satisfied | No storage location reminder = still has to scan the rack | Location field prominently shown on detail page so he knows which rack to check |

---

#### Key Moments

- **Decision Point — Browse Candidates stage:** The Drink Now shelf is where Marcus makes his choice. If ratings aren't visible on cards he must tap into each wine detail — that friction causes him to abandon the app and guess from memory.
- **Risk of Abandonment — Open App stage:** A dashboard that doesn't load within 1 second or requires a filter action before showing drink-now candidates will send Marcus back to memory/guessing.
- **Delight Opportunity — Select a Wine stage:** Seeing his own past rating on the detail page ("I gave this 4 stars last April") creates a mini-narrative reward loop that reinforces logging behavior.

#### Success Outcome

Marcus identifies a drink-now candidate and confirms his choice within 60 seconds of opening the app, with zero manual filtering or formula evaluation. *(JTBD-01.2 success measure)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Open App | F6 (Dashboard) |
| Scan Dashboard | F5 (Readiness badges), F6 (Drink Now shelf + stat tile) |
| Browse Candidates | F5, F6, F4 (rating on cards) |
| Select a Wine | F0 (detail view), F4 (tasting notes), F5 (badge on detail) |
| Decide & Act | F2 (location field on detail) |

---

### JRN-01.3: Logging a Consumed Bottle and Saving a Quick Tasting Note

**Persona:** PER-01 (Marcus Delgado)

**Scenario:** Marcus just finished the Grenache he opened for Thursday pasta night. The bottle is empty on the table and he wants to (a) mark it consumed and (b) jot down whether he'd buy it again — before he forgets. He's got maybe two minutes before he starts cleaning up.

**Related Jobs:** JTBD-01.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Locate the Wine** | Opens app, goes to the Drink Now shelf or searches for the wine by name | `/` or `/cellar` search (F3, F6) | "I just had this open — it should be easy to find" | Mildly impatient | Having to navigate to cellar and type a search after a meal is friction | Most-recently-viewed wine accessible from dashboard "Recently Consumed" or direct search; persistent session context |
| **Decrement Quantity** | Taps the "−" control on the wine detail or list card | `/wines/[id]` or `/cellar` card (F1) | "Down to 1 bottle left" | Neutral | No visual confirmation of the quantity change before the prompt fires | Optimistic UI update showing new quantity immediately; prompt appears as a bottom sheet, not a full page redirect |
| **Select Event Type** | Chooses "Consumed" from the event-type prompt | Event-type bottom sheet (F1) | "Consumed — yes, I drank it, not gifted it" | Casual | Prompt appears as a modal that blocks the whole screen and feels heavy for a routine action | Lightweight bottom-sheet or inline choice (Consumed / Gifted / Opened) with large tap targets |
| **Add Tasting Note** | Taps "Add note" in the post-consume prompt; selects 4 stars; types one sentence in the Flavor field | `/wines/[id]/notes/new` (F4) | "4 stars, good with food, would buy again — done" | Satisfied, slightly rushed | Note form has too many required fields for a quick entry; rating takes multiple taps | Star rating as first, most prominent field; all structured fields optional for quick entry; default note date = today; saves in ≤2 taps after rating |
| **Save & Return** | Taps Save; note is linked to wine record; event log entry created | `/wines/[id]` (F1, F4) | "Done. Now it's in there. I'll actually remember this wine." | Relieved, slightly pleased with himself | No confirmation that note is linked to the wine record, not stored as a loose note | Post-save redirect to wine detail showing the new note at the top of the notes list; event log entry visible |

---

#### Key Moments

- **Decision Point — Add Tasting Note stage:** If the note form has too many mandatory fields, Marcus will abandon without saving a rating. The form must work as a "rating-only" entry with all text fields optional.
- **Risk of Abandonment — Locate the Wine stage:** If Marcus has to navigate manually to find the wine he just drank, he'll skip the logging step entirely. Post-consume prompt that doesn't require re-navigation is critical.
- **Delight Opportunity — Save & Return stage:** Seeing his new note at the top of the wine's history ("You rated this 4 stars — 3 notes total") builds the tasting history he values for re-buy decisions.

#### Success Outcome

Marcus reaches the tasting note form in ≤3 taps from the consumption event, saves a star rating and one-sentence note, and the note appears linked to the wine record — all in under 2 minutes. *(JTBD-01.3 success measure)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Locate the Wine | F3 (search), F6 (recently consumed) |
| Decrement Quantity | F1 (quantity control) |
| Select Event Type | F1 (event type prompt) |
| Add Tasting Note | F4 (tasting note form) |
| Save & Return | F1 (event log), F4 (note linked to record) |

---

## PER-02: Claire Fontaine — Avid Cellar Builder & Long-Term Ager

---

### JRN-02.1: Finding Which Wines to Hold vs. Drink

**Persona:** PER-02 (Claire Fontaine)

**Scenario:** It's Sunday morning and Claire is planning the week. She wants to know exactly which bottles in her Basement Rack A are still in "Hold" territory — wines she absolutely must not touch — so she can pull anything else without second-guessing herself. She also wants to cross-check the Eurocave for wines approaching their peak window. Her old spreadsheet formula for this took 20 minutes to refresh; she expects the app to show her current, accurate state immediately.

**Related Jobs:** JTBD-02.1, JTBD-02.2

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Open App** | Opens the app on her tablet at the kitchen table | App launch → `/` dashboard (F6) | "I want to see the cellar state — let me check the dashboard first for anything obvious" | Methodical, focused | Dashboard doesn't distinguish Hold from Drink Now in its stat summary | Add an "On Hold" stat tile alongside the Drink Now tile; Approaching Peak count also visible at a glance |
| **Navigate to Cellar** | Taps the cellar link or navigates to `/cellar` | `/` → `/cellar` (F3) | "I need to filter — location AND readiness together" | Purposeful | Filter panel not visible without an extra tap; she has to discover it | Filter panel open by default (or a visible "Filter" button) on `/cellar`; filter chips show active state clearly |
| **Apply Location Filter** | Opens filter panel; selects "Basement Rack A" from the location dropdown | `/cellar` filter panel (F2, F3) | "Basement Rack A — I want to see only those 80 bottles" | Focused | Location list is in alphabetical order but has inconsistent naming from when she set them up | Consistent nomenclature enforced at location creation; filter returns results in <200ms |
| **Apply Readiness Filter** | Adds "Hold" to the active filters | `/cellar` filter panel (F3, F5) | "Now show me just the Hold wines in Rack A" | Determined | Combined filters might wipe each other out or not stack properly | Filter chips stack correctly; both Location and Readiness chips visible simultaneously; result count updates live |
| **Review Hold List** | Scans the filtered wine list, notes wines she must not touch; switches location to "Eurocave" and changes readiness to "Approaching Peak" | `/cellar` filtered list (F3, F5) | "Good — 22 bottles on Hold in Rack A. Now let me check the Eurocave Approaching Peak ones…" | Relieved, methodical | Changing one filter clears another; has to re-apply the second filter each time | Filters are independently editable without resetting others; active filter chips each have an individual × to dismiss |
| **Confirm & Plan** | Notes the Approaching Peak wines on the Eurocave list; closes app with a clear plan | App closed | "Two bottles approaching peak in the Eurocave — I'll plan a dinner around one of them next month" | Satisfied, confident | No way to bookmark or annotate the filter view for later reference | Export or share-as-text option (post-MVP); for now, at minimum, session-persistent filter state so she can return |

---

#### Key Moments

- **Decision Point — Apply Readiness Filter stage:** If combined filters don't stack correctly and one clears the other, Claire loses trust in the filter system immediately. She will return to the spreadsheet.
- **Risk of Abandonment — Navigate to Cellar stage:** If the filter panel requires multiple taps to open and apply, Claire will judge the tool as not significantly better than Excel.
- **Delight Opportunity — Review Hold List stage:** A correctly rendered, date-accurate Hold list for 80+ bottles in under 200ms is the single biggest "aha" moment for Claire — it proves the tool replaced her stale spreadsheet formula.

#### Success Outcome

Claire filters to Hold wines in Basement Rack A and sees a complete, date-accurate list in under 200ms, then switches to Approaching Peak + Eurocave without resetting her workflow — all without a single formula update. *(JTBD-02.1 + JTBD-02.2 success measures)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Open App | F6 (Dashboard — stat tiles) |
| Navigate to Cellar | F3 (Search & Filter entry) |
| Apply Location Filter | F2 (location names), F3 (location filter) |
| Apply Readiness Filter | F3 (readiness filter), F5 (badge calculation) |
| Review Hold List | F3, F5 (badge-accurate list) |
| Confirm & Plan | F3 (session-persistent filter state) |

---

### JRN-02.2: Adding a Structured Tasting Note for an Aged Bottle

**Persona:** PER-02 (Claire Fontaine)

**Scenario:** Claire has just opened a 2012 Barolo she has been aging for 12 years for a Saturday dinner with friends. The bottle is exceptional. She wants to capture every sensory dimension while it's in the glass — appearance, aroma, flavor, finish — plus a 100-point score and an occasion label. She also wants to be sure that if she accidentally navigates away mid-note, she doesn't lose her work.

**Related Jobs:** JTBD-02.3

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Find the Wine Record** | Opens app, navigates to `/cellar`, searches "2012 Barolo", opens the wine detail page | `/cellar` search → `/wines/[id]` (F0, F3) | "I know exactly what this is — let me pull it up fast so I can start taking notes" | Eager, focused | Search results might not be fast enough on a 300-bottle dataset for her to trust the result | Client-side search returns results after first keystroke; producer and name visible on result cards |
| **Open Tasting Note Form** | Taps "Add Tasting Note" on the wine detail page | `/wines/[id]` → `/wines/[id]/notes/new` (F4) | "Is the 100-point scale selected? I need to make sure before I type the score" | Methodical | Default rating scale might be 5-star (Marcus's preference) — she needs 100-point | Rating-scale preference stored per user (setting); note form opens with her preferred 100-point scale pre-selected |
| **Enter Structured Fields** | Types observations in Appearance, Aroma, Flavor, and Finish fields; enters a score of 94; selects "Dinner Party" as occasion | `/wines/[id]/notes/new` (F4) | "I want these fields separate — not one big text blob. Let me be thorough while it's in the glass." | Absorbed, deliberate | One large free-text field instead of dedicated structured fields forces her own formatting, which won't be searchable later | Four clearly labelled, independently focusable text areas (Appearance, Aroma, Flavor, Finish) in a logical vertical flow |
| **Navigate Away Accidentally** | Guest asks a question; she locks the phone and unlocks it 10 minutes later; app returns to the note form | `/wines/[id]/notes/new` (F4) | "Did I lose everything? My Word notes always get wiped when the laptop sleeps…" | Anxious | Form state lost on background → foreground switch or navigation event wipes her 200-word entry | Form state preserved on visibility change and back-navigation (sessionStorage or draft-save); all field values intact on return |
| **Save & Verify** | Reviews the pre-save summary, taps Save; sees the note appear on the wine detail page in reverse-chronological order | `/wines/[id]` (F4, F1) | "Perfect — 94 points, all four fields, Dinner Party. And it's linked to the Barolo record, not floating in a Word doc." | Deeply satisfied | Post-save note is buried below other information or not visibly linked to the wine | Note appears at the top of the notes list on wine detail; displays score, date, occasion, and a truncated first field |

---

#### Key Moments

- **Decision Point — Open Tasting Note Form stage:** If the rating scale is wrong (5-star instead of 100-point) Claire either abandons or has to navigate to settings first — interrupting the flow during a dinner party.
- **Risk of Abandonment — Navigate Away Accidentally stage:** Data loss on background switch is the single most catastrophic failure for Claire. She described this as a hard dealbreaker in her pain points ("the spreadsheet breaks down on mobile"). Form state preservation is non-negotiable.
- **Delight Opportunity — Save & Verify stage:** The note appearing permanently linked to the Barolo record, with all four sensory fields and a 100-point rating, represents the exact outcome Claire has been unable to achieve with Word + Excel for 12 years.

#### Success Outcome

Claire saves a complete tasting note (all four sensory fields, 100-point rating, occasion label) with no data loss on back-navigation, in a single session, and sees it linked to the wine record. *(JTBD-02.3 success measure)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Find the Wine Record | F3 (search), F0 (wine detail) |
| Open Tasting Note Form | F4 (notes/new route) |
| Enter Structured Fields | F4 (structured fields, rating scale preference) |
| Navigate Away Accidentally | F4 (form state preservation) |
| Save & Verify | F4 (linked note), F1 (consumption/event context) |

---

### JRN-02.3: Managing Storage Locations and Auditing Bottle Placement

**Persona:** PER-02 (Claire Fontaine)

**Scenario:** Claire has just received a case of 2022 Nuits-Saint-Georges (12 bottles) and needs to split it across two storage locations: 8 bottles go to Basement Rack A and 4 go to the Eurocave. She also wants to do a quick location audit — checking the `/locations` summary to ensure her bottle counts still add up correctly after a recent reorganization.

**Related Jobs:** JTBD-02.1, JTBD-02.4

---

#### Journey Stages

| Stage | Action | Touchpoint | Thinking | Feeling | Pain Point | Opportunity |
|---|---|---|---|---|---|---|
| **Add New Case — First Record** | Navigates to `/wines/new`; fills in all fields for the Nuits-Saint-Georges; sets quantity to 8; selects "Basement Rack A" as location; sets drinking window 2030–2042 | `/wines/new` (F0, F2, F5) | "8 bottles in Rack A with a drinking window starting 2030 — this should be straightforward" | Methodical, careful | Form doesn't validate that the drinking window end year is after the start year — data entry error possible | Inline validation: end year ≥ start year; drinking window badge preview shown before save |
| **Add Second Record (Split Case)** | Creates a second wine record for the same wine, quantity 4, location "Eurocave", same drinking window | `/wines/new` (F0, F2) | "The app treats location as per-record, so I need two records for one wine split across locations — is that right?" | Slightly uncertain | The data model requires two records for the same wine in two locations; this is correct but non-obvious | Inline guidance or tooltip on the location field explaining split-location handling; duplicate-from-existing option to speed up the second entry |
| **Navigate to Locations Audit** | Goes to `/locations` to check the updated bottle counts per location | `/locations` (F2) | "Basement Rack A should now show 89 bottles total — let me verify" | Methodical | Locations page shows only names and counts, not enough granularity to spot a discrepancy | Locations page shows: location name, bottle count, wine count (distinct wines), and links to the pre-filtered cellar list |
| **Drill into Location** | Taps "Basement Rack A" → filtered `/cellar` list showing only that location's wines | `/locations` → `/cellar?location=Basement+Rack+A` (F2, F3) | "89 bottles across 34 wines — that matches my physical count. Good." | Confident | Filter from locations page doesn't carry through to cellar list — she has to re-apply the location filter manually | Tapping a location card on `/locations` pre-applies the location filter on `/cellar`; active filter chip shows "Basement Rack A" |
| **Review Dashboard After** | Navigates to `/` to see updated total bottle count and collection breakdown | `/` dashboard (F6) | "301 bottles now — the type and decade breakdown should update too" | Satisfied | Dashboard shows stale counts from before she added the new wines | Dashboard stats calculated from live DB query on each load; no caching of bottle counts |

---

#### Key Moments

- **Decision Point — Add Second Record (Split Case) stage:** Claire must understand that the app's one-location-per-record model requires two entries for a split case. If this isn't guided, she'll create one record with the wrong location and lose 4 bottles from her Rack A count.
- **Risk of Abandonment — Navigate to Locations Audit stage:** If `/locations` only shows names without counts, Claire cannot perform the audit she needs and will return to her Excel layout tabs.
- **Delight Opportunity — Drill into Location stage:** One-tap drill-through from `/locations` to a pre-filtered cellar list is the instant-gratification moment that makes Claire feel the app is smarter than her spreadsheet.

#### Success Outcome

Claire adds a split-location case with correct quantities and drinking windows, audits the `/locations` page to verify counts, and drills through to a pre-filtered cellar list — all without opening the spreadsheet. *(JTBD-02.1 success measure; JTBD-02.4 collection visibility)*

#### Feature Touchpoints

| Stage | Features |
|---|---|
| Add New Case — First Record | F0 (wine CRUD), F2 (location selector), F5 (drinking window) |
| Add Second Record (Split Case) | F0, F2 |
| Navigate to Locations Audit | F2 (`/locations` route) |
| Drill into Location | F2, F3 (pre-filtered cellar list) |
| Review Dashboard After | F6 (live stat tiles, breakdown cards) |

---

## Cross-Journey Patterns

### CP-1: Dashboard as Universal Entry Point
Every journey — for both Marcus and Claire — starts at or passes through the `/` dashboard. Marcus uses it as the primary decision surface; Claire uses it as a quick sanity check before navigating deeper. **Implication:** The dashboard must serve two cognitive modes simultaneously — "what do I open tonight?" (Marcus) and "what's my collection state?" (Claire). The Drink Now shelf, the Hold count tile, and the Approaching Peak count must all be visible above the fold at 375px.

### CP-2: Mobile Form Reliability is a Trust Gate
Both JRN-01.1 (adding a purchase at the shop) and JRN-02.2 (structured tasting note mid-dinner) surface the same root anxiety: "Will this save correctly on mobile?" Marcus fears horizontal scroll and vintage typos; Claire fears data loss on navigation. **Implication:** Mobile form reliability — validated inputs, preserved state on background switch, immediate save confirmation — is the single highest-impact investment for user trust across both personas.

### CP-3: Filter Stacking is Core to Claire, Invisible to Marcus
JRN-02.1 depends entirely on combined Location + Readiness filters working correctly and stackably. Marcus never uses multi-dimensional filters (his cellar is small enough for visual scan). **Implication:** The filter system must support multi-dimensional stacking by default, but the UI must not feel complex to Marcus. Solution: dismissible filter chips that appear only when active; filter panel collapsed by default but one tap away.

### CP-4: Tasting Notes Are the Long-Term Value Loop
Both JRN-01.3 and JRN-02.2 end with a tasting note save. Marcus uses it to decide whether to re-buy; Claire uses it to build a permanent sensory archive. Both need the note to be **linked to the wine record** — not a loose entry. **Implication:** The note detail view on `/wines/[id]` is a high-value surface; notes must be visible as soon as the user lands on the detail page, not hidden behind a tab or scroll.

### CP-5: Location Data Integrity Underpins Both Personas
Marcus assigns a single location when adding a bottle (JRN-01.1). Claire audits location accuracy weekly (JRN-02.3). Both are harmed if location data is stale, missing, or orphaned. **Implication:** The requirement that every wine record has exactly one non-null location (F2) is a data-integrity constraint that protects both use cases. "Location Unknown" flag after location deletion must be surfaced visibly — not silently — to prompt Claire to re-assign and protect Marcus from invisible gaps.

---

## Journey-to-JTBD Traceability

| JRN-ID | Stage | JTBD-ID | Expected Outcome |
|---|---|---|---|
| JRN-01.1 | Trigger | JTBD-01.1 | App loads fast enough that the purchase-context window stays open |
| JRN-01.1 | Enter Details | JTBD-01.1 | Vintage validated inline; no horizontal scroll at 375px |
| JRN-01.1 | Assign Location | JTBD-01.1 | Location assigned at creation; record immediately persisted |
| JRN-01.1 | Save & Confirm | JTBD-01.1 | New wine record created in <90 sec on mobile |
| JRN-01.2 | Open App | JTBD-01.2 | Dashboard loads within 1s on warm container |
| JRN-01.2 | Scan Dashboard | JTBD-01.2 | Drink Now shelf visible without scroll; stat tile shows count |
| JRN-01.2 | Browse Candidates | JTBD-01.2 | Readiness badges current-date-accurate; rating on card |
| JRN-01.2 | Select a Wine | JTBD-01.2 | Drink-now candidate identified within 60 sec; zero manual filtering |
| JRN-01.3 | Decrement Quantity | JTBD-01.3 | Quantity decrement triggers event-type prompt inline |
| JRN-01.3 | Select Event Type | JTBD-01.3 | Event logged as Consumed; tasting note flow offered within 3 taps |
| JRN-01.3 | Add Tasting Note | JTBD-01.3 | Rating + one-sentence note saved in <2 min |
| JRN-01.3 | Save & Return | JTBD-01.3 | Note linked to wine record; event log entry created |
| JRN-02.1 | Apply Location Filter | JTBD-02.1 | Location filter returns correct wines in <200ms for 300-bottle dataset |
| JRN-02.1 | Apply Readiness Filter | JTBD-02.2 | Hold badge calculated from current date; combined filters stack correctly |
| JRN-02.1 | Review Hold List | JTBD-02.2 | Date-accurate Hold list rendered; no stale badge states |
| JRN-02.1 | Confirm & Plan | JTBD-02.2 | Session-persistent filter state allows workflow continuation |
| JRN-02.2 | Open Tasting Note Form | JTBD-02.3 | 100-point scale pre-selected per user preference |
| JRN-02.2 | Enter Structured Fields | JTBD-02.3 | All 4 sensory fields + 100-pt rating + occasion saved |
| JRN-02.2 | Navigate Away Accidentally | JTBD-02.3 | No data loss on back-navigation; form state preserved |
| JRN-02.2 | Save & Verify | JTBD-02.3 | Complete note linked to wine record; visible on detail page |
| JRN-02.3 | Add New Case — First Record | JTBD-02.1 | Drinking window validated; location required at creation |
| JRN-02.3 | Navigate to Locations Audit | JTBD-02.1 | `/locations` shows bottle counts per location |
| JRN-02.3 | Drill into Location | JTBD-02.1 | Pre-filtered cellar list from locations page in <200ms |
| JRN-02.3 | Review Dashboard After | JTBD-02.4 | Live type/decade breakdown renders for 300+ bottles in <1s |

---

*Related documents: PERSONAS-SimpleWineApp.md, JTBD-SimpleWineApp.md, PRD-SimpleWineApp.md*
*Last updated: 2026-06-05*
