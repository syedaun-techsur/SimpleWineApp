# Jobs-to-be-Done — SimpleWineApp

| Field | Value |
|---|---|
| **Product** | SimpleWineApp |
| **Version** | 1.0 |
| **Date** | 2026-06-05 |
| **Status** | Draft |
| **Related Personas** | PERSONAS-SimpleWineApp.md (PER-01, PER-02) |
| **Related PRD** | PRD-SimpleWineApp.md |
| **Author** | Pivota Spec JTBD Generator |

---

## JTBD Summary Table

| JTBD-ID | Persona | Job Statement (abbreviated) | Priority |
|---|---|---|---|
| JTBD-01.1 | PER-01 Marcus Delgado | Log a new bottle at the shop before the receipt disappears | P0 |
| JTBD-01.2 | PER-01 Marcus Delgado | Know what to open tonight without hunting through records | P0 |
| JTBD-01.3 | PER-01 Marcus Delgado | Capture a tasting note the moment a bottle is finished | P1 |
| JTBD-01.4 | PER-01 Marcus Delgado | Confirm bottle counts without physically walking to the rack | P1 |
| JTBD-02.1 | PER-02 Claire Fontaine | Retrieve any bottle's exact location across multiple storage spaces | P0 |
| JTBD-02.2 | PER-02 Claire Fontaine | Know which wines are not yet ready and must be left untouched | P0 |
| JTBD-02.3 | PER-02 Claire Fontaine | Record a complete structured tasting note after opening an aged bottle | P1 |
| JTBD-02.4 | PER-02 Claire Fontaine | Review collection composition to guide future buying decisions | P1 |

---

## PER-01: Marcus Delgado — Casual Wine Drinker & Collector

### JTBD-01.1: Capture a New Purchase While Still at the Shop

**Job Statement:**
When I'm standing at a wine shop or have just arrived home with a bag of bottles, I want to log the new purchase in under a minute on my phone, so I can have an accurate cellar record while the label details are still in front of me.

**Current Alternatives:**
- Types a quick note in Apple Notes or a shared text thread and intends to transfer it to a spreadsheet later (often never happens)
- Photographs the label and lets it accumulate in the camera roll with no structured record attached
- Skips recording entirely and relies on memory for bottles he "just bought"

**Hiring Criteria:**
- A mobile add-wine form fully usable at 375px with no horizontal scroll
- Required fields (name, producer, vintage, type, quantity) completable in under 5 taps + typing
- Vintage year validated automatically so typos on a touch keyboard are caught inline
- Record persisted immediately to the database — not a local draft that could be lost

**Success Measure:** Marcus can create a complete wine record (name, producer, vintage, type, quantity, location) on a 375px iPhone screen in under 90 seconds from the moment he opens the app.

**Related Features:** F0, F2
**Priority:** P0

---

### JTBD-01.2: Choose What to Open Tonight Without Digging Through Records

**Job Statement:**
When I'm about to sit down for dinner or someone arrives unexpectedly, I want to see which of my bottles are ready to drink right now, so I can make a confident choice in seconds without scrolling a spreadsheet.

**Current Alternatives:**
- Cross-references two spreadsheet tabs and manually filters by an estimated "drink by" column he updates inconsistently
- Guesses based on memory and picks something from the rack by visual inspection
- Texts a wine-savvy friend for a recommendation rather than consulting his own records

**Hiring Criteria:**
- A dashboard landing page that surfaces a "Drink Now" shelf prominently without requiring any navigation
- Readiness badges calculated automatically from the current date — no stale states, no manual refresh required
- Drink-now count visible as a summary stat tile on the default landing page
- Page loads and displays current badge state within 1 second on a warm container

**Success Measure:** Marcus can identify at least one drink-now candidate and navigate to its detail page within 60 seconds of opening the app, with zero manual filtering or formula evaluation.

**Related Features:** F5, F6
**Priority:** P0

---

### JTBD-01.3: Record a Quick Tasting Note the Moment a Bottle Is Finished

**Job Statement:**
When I finish a bottle and want to remember whether to buy it again, I want to log a brief rating and note in the moment without switching apps or hunting for a form, so I can make a re-buy decision later based on my actual experience.

**Current Alternatives:**
- Leaves a voice memo to himself that he rarely reviews
- Posts an Instagram caption with the rating that is impossible to search later
- Does nothing and forgets the wine within a week
- Opens the shared Apple Notes file and adds a line — disconnected from the bottle's purchase record

**Hiring Criteria:**
- A tasting note entry flow reachable in 3 taps or fewer from the bottle detail or consumption event
- Flexible rating scale: 5-star (preferred for quick sessions) or 100-point selectable as a user preference
- Note fields for appearance, aroma, flavor, finish available but not mandatory for a quick rating-only entry
- Note is linked to the wine record, not stored separately

**Success Measure:** Marcus can reach the tasting note form, enter a star rating and a one-sentence note, and save — in under 2 minutes, from 3 taps or fewer after decrementing a bottle.

**Related Features:** F1, F4
**Priority:** P1

---

### JTBD-01.4: Confirm Bottle Counts Without Walking to the Rack

**Job Statement:**
When I'm at a grocery store or wine shop deciding whether to buy another bottle of a wine I already own, I want to check my current quantity for that wine on my phone, so I can avoid over-buying or duplicating a bottle I already have plenty of.

**Current Alternatives:**
- Calls his partner to ask if the wine is still in the rack
- Buys it anyway to be safe and ends up with more than intended
- Searches his Numbers spreadsheet on mobile — columns don't fit and text is too small to read accurately

**Hiring Criteria:**
- A fast search by wine name or producer that returns results on the `/cellar` route in real time (client-side, no page reload)
- Quantity displayed prominently on wine list cards so he can confirm stock without opening the detail page
- Collection total (bottle count) visible as a stat tile on the dashboard for a quick sense-check

**Success Measure:** Marcus can search for a specific wine by name and confirm its remaining quantity within 30 seconds of opening the app on mobile.

**Related Features:** F0, F3, F6
**Priority:** P1

---

## PER-02: Claire Fontaine — Avid Cellar Builder & Long-Term Ager

### JTBD-02.1: Retrieve Any Bottle's Exact Location Across Multiple Storage Spaces

**Job Statement:**
When I'm in the basement or home office physically pulling a bottle for a special occasion, I want to query exactly where a specific wine is stored and go straight to it, so I can retrieve it without hunting across three different racks and risking disturbing neighboring bottles.

**Current Alternatives:**
- Maintains separate tabs in her Excel workbook for each storage location — they frequently fall out of sync when a bottle is moved
- Relies on color-coded labels she has affixed to bottles — works only if she can see the label from where she's standing
- Texts herself a note after moving a bottle and updates the spreadsheet the next time she opens a laptop

**Hiring Criteria:**
- Every wine record requires exactly one named storage location assigned at creation — no "location unknown" entries after initial setup
- A filter on the `/cellar` route for storage location that returns correct results in under 200ms for a 300-bottle dataset
- Location selector populated from user-managed named locations (e.g., "Basement Rack A", "Eurocave") so searches use consistent nomenclature
- A `/locations` route showing all locations with bottle counts so she can audit her layout at a glance

**Success Measure:** Claire can filter to a specific storage location and retrieve the row for a named wine within 30 seconds, from any device, with zero spreadsheet cross-referencing.

**Related Features:** F2, F3
**Priority:** P0

---

### JTBD-02.2: Identify Which Wines Must Be Left Untouched Without Recalculating Dates

**Job Statement:**
When I'm planning which bottles to access versus which to leave undisturbed, I want to see a current "Hold" filter view across my entire cellar without manually checking formulas or spreadsheet dates, so I can protect aging bottles from premature consumption.

**Current Alternatives:**
- Maintains drinking-window start/end columns in Excel and runs a filter formula — formula goes stale when the file hasn't been opened in weeks
- Applies a physical tag to bottles she wants to hold, which is invisible in the digital record
- Estimates from memory for wines she purchased within the last year or two

**Hiring Criteria:**
- Readiness badges (Hold, Approaching Peak, Drink Now, Past Window) auto-derived from the current year on every page load — no caching, no stale states
- "Hold" badge filterable on the `/cellar` route, combinable with a location filter (e.g., Hold + Basement Rack A)
- Badge state accurate without any user action after the initial drinking-window setup on the wine record
- Approaching Peak badge fires when within 2 years of the window start, giving Claire advance warning

**Success Measure:** Claire can filter to Hold wines in a specific location and view a complete, date-accurate list in under 200ms — with zero manual formula updates required before or after the query.

**Related Features:** F3, F5
**Priority:** P0

---

### JTBD-02.3: Record a Complete Structured Tasting Note After Opening an Aged Bottle

**Job Statement:**
When I open a bottle I have been aging for 8–12 years, I want to record detailed structured observations across appearance, aroma, flavor, and finish plus a 100-point rating, so I can build a permanent, searchable tasting history linked to the wine record for future purchase and cellar decisions.

**Current Alternatives:**
- Writes notes in a separate Word document with a custom heading format — not linked to any wine record, impossible to surface at purchase time
- Uses a paper tasting journal and photographs pages occasionally — unstructured and unsearchable
- Enters notes into a competitor app that lacks drinking-window integration and structured field separation

**Hiring Criteria:**
- Dedicated structured note fields: appearance, aroma, flavor, finish (all free text, each independently navigable)
- 100-point rating scale selectable as a user preference (not just 5-star)
- Multiple notes per wine displayed in reverse-chronological order on the wine detail page
- Notes survive back-navigation without data loss — form state preserved if she accidentally navigates away
- Note linked permanently to the wine record, visible alongside purchase and location data

**Success Measure:** Claire can save a complete tasting note with all four sensory fields populated, a 100-point rating, and an occasion label — with no data loss on back-navigation — in a single session on any device.

**Related Features:** F4, F1
**Priority:** P1

---

### JTBD-02.4: Review Collection Composition Before a Buying Trip

**Job Statement:**
When I'm planning a buying trip or auction bid, I want to see a breakdown of my collection by wine type, country, and vintage decade, so I can identify gaps and avoid over-concentrating in styles or vintages I already have too many of.

**Current Alternatives:**
- Runs manual pivot tables in Excel before each buying trip — takes 20–30 minutes to refresh and format
- Estimates from memory — imprecise for a 300-bottle collection distributed across multiple locations
- Exports the spreadsheet to a chart tool and builds visualizations manually

**Hiring Criteria:**
- Dashboard breakdowns by wine type (Red/White/Sparkling/Rosé/Fortified), country/region, and vintage decade rendered on the default landing page without any query input
- Breakdowns accurate for a 300+ bottle collection and render within 1 second on a warm container
- Each breakdown card links to the `/cellar` route pre-filtered to that subset so she can drill in immediately
- Highest-rated wines surfaced separately for quality pattern analysis

**Success Measure:** Claire can review her collection's type, country, and vintage-decade composition and identify her top over- and under-represented categories within 3 minutes of opening the app, with no spreadsheet or external tool required.

**Related Features:** F6, F3
**Priority:** P1

---

## Outcome-to-Feature Traceability

| JTBD-ID | Related Features | Expected Outcome |
|---|---|---|
| JTBD-01.1 | F0, F2 | New wine record created in <90 sec on mobile; vintage validated inline; location assigned at creation |
| JTBD-01.2 | F5, F6 | Drink Now shelf visible on dashboard default landing; readiness badge always current-date-accurate |
| JTBD-01.3 | F1, F4 | Tasting note reachable in ≤3 taps from consumption event; rating linked to wine record |
| JTBD-01.4 | F0, F3, F6 | Wine found by name search in <30 sec; quantity visible on list card and dashboard stat tile |
| JTBD-02.1 | F2, F3 | Every wine has a named location; location filter returns correct results in <200ms for 300 bottles |
| JTBD-02.2 | F3, F5 | Hold + location combined filter accurate on every load; no stale badge states |
| JTBD-02.3 | F4, F1 | All 4 sensory fields + 100-pt rating + occasion saved; no data loss on back-navigation |
| JTBD-02.4 | F6, F3 | Type/country/decade breakdowns render in <1s for 300+ bottles; each card links to filtered cellar list |

**Feature coverage check:**

| Feature ID | Covered by JTBD(s) |
|---|---|
| F0 | JTBD-01.1, JTBD-01.4 |
| F1 | JTBD-01.3, JTBD-02.3 |
| F2 | JTBD-01.1, JTBD-02.1 |
| F3 | JTBD-01.4, JTBD-02.1, JTBD-02.2, JTBD-02.4 |
| F4 | JTBD-01.3, JTBD-02.3 |
| F5 | JTBD-01.2, JTBD-02.2 |
| F6 | JTBD-01.2, JTBD-01.4, JTBD-02.4 |

All 7 PRD features (F0–F6) are covered by at least one JTBD.

---

## NaC Preview

Candidate Natural Acceptance Criteria derived from each job's success measure. These will be refined into full Natural Acceptance Criteria in the STORY-MAP and NARRATIVE-TEST documents.

| JTBD-ID | Outcome | Candidate Natural Acceptance Criterion |
|---|---|---|
| JTBD-01.1 | New bottle logged in <90 sec on mobile | Given Marcus opens `/wines/new` on a 375px screen, when he fills in name, producer, vintage, type, quantity, and location and taps Save, then the wine record appears in the collection list within 90 seconds of starting the form — with no horizontal scroll required at any step |
| JTBD-01.2 | Drink-now candidate found within 60 sec | Given at least one wine has a drinking window that includes the current year, when Marcus opens the app at `/`, then the Drink Now shelf displays that wine and the Drink Now stat tile shows a count ≥ 1 — without any filter action or manual refresh |
| JTBD-01.3 | Tasting note saved in <2 min from ≤3 taps | Given Marcus decrements a bottle's quantity and selects "Consumed", when the consume event flow completes, then a tasting note entry is reachable within 3 taps, and saving a rating + one-sentence note completes in under 2 minutes with the note linked to the wine record |
| JTBD-01.4 | Quantity confirmed in <30 sec by search | Given Marcus types a wine name into the search field on `/cellar`, when results appear client-side, then the matching wine's remaining quantity is visible on the list card within 30 seconds — with no page reload required |
| JTBD-02.1 | Specific wine located in <30 sec by location filter | Given all wines have an assigned storage location, when Claire filters `/cellar` by "Basement Rack A", then only wines assigned to that location are returned and rendered in under 200ms for a 300-bottle dataset |
| JTBD-02.2 | Hold + location combined filter returns current-date-accurate results | Given at least one wine has a drinking window start year after the current year, when Claire applies the Hold readiness filter and a location filter simultaneously, then only wines matching both criteria appear — with badge states reflecting today's date, not a cached value |
| JTBD-02.3 | Full tasting note saved with no data loss on back-navigation | Given Claire opens a tasting note form for a wine and fills in appearance, aroma, flavor, finish, a 100-point rating, and an occasion label, when she navigates back and returns to the form, then all field values are preserved and saving produces a complete note linked to the wine record |
| JTBD-02.4 | Collection breakdown renders in <1s for 300+ bottles | Given a collection of 300+ wines with varied types, countries, and vintages, when Claire opens the dashboard at `/`, then type, country/region, and vintage-decade breakdowns all render correctly within 1 second — and each breakdown card navigates to a correctly pre-filtered cellar list |

---

*Related documents: PERSONAS-SimpleWineApp.md, PRD-SimpleWineApp.md*
*Last updated: 2026-06-05*
