# Personas — SimpleWineApp

| Field | Value |
|---|---|
| **Product** | SimpleWineApp |
| **Version** | 1.0 |
| **Date** | 2026-06-05 |
| **Status** | Draft |
| **Related PRD** | PRD-SimpleWineApp.md |
| **Author** | Pivota Spec Personas Generator |

---

## Persona Summary

| ID | Name | Role | Primary Goal |
|---|---|---|---|
| PER-01 | Marcus Delgado | Casual Wine Drinker & Collector | Quickly log wines and know what to open tonight without digging through a spreadsheet |
| PER-02 | Claire Fontaine | Avid Cellar Builder & Long-Term Ager | Manage a large, structured cellar with precise location tracking and drinking-window discipline |

---

## PER-01: Marcus Delgado — Casual Wine Drinker & Collector

**Role & Context:**
Marcus is a 38-year-old marketing director who buys wine regularly — one to three bottles a week — and drinks most of what he purchases within a few months. He has around 30–60 bottles at any given time spread across a small kitchen rack and a floor-standing unit in the living room. Marcus discovered wine through food pairing and still thinks of his collection primarily as a rotating pantry rather than an investment. He currently tracks purchases in a shared Apple Note with his partner and occasionally a Numbers spreadsheet, but forgets to update it after a busy week and can never remember if he has a specific bottle left. He reaches for his iPhone to check "what's in the rack" at least three times a week — while grocery shopping, before a dinner party, or when browsing a wine shop. He wants a tool he can update in 30 seconds, not one that requires a laptop and ten minutes of data entry.

**Goals:**
- Log a new bottle at the shop in under a minute so the record exists while the receipt is still in hand (F0)
- Quickly see what's ready to drink tonight without scrolling a spreadsheet (F5, F6)
- Track when he finishes a bottle and jot a quick note so he can decide whether to re-buy (F1, F4)
- Know how many bottles he has on hand without counting physically (F0, F6)

**Pain Points:**
- Mobile interface on a spreadsheet is painful — columns don't fit, typing vintage years is error-prone on a touch keyboard (PRD §2)
- Frequently finishes a wine he wanted to remember and has no quick way to capture a rating in the moment (PRD §2)
- No at-a-glance view: getting a count of what's ready to drink now requires filtering a spreadsheet manually (PRD §2)
- Tasting notes are scattered across the Notes app, texts to friends, and Instagram captions (PRD §2)

**Technical Expertise:** Comfortable — uses smartphone apps daily, confident with web forms; does not use command-line tools and prefers minimal configuration.

**Top Tasks:**
1. Add a newly purchased wine from the shop (daily/weekly, critical — must be fast on mobile)
2. Check the dashboard to see drink-now candidates before choosing a bottle for dinner (2–4×/week, high)
3. Log a bottle as consumed and save a quick tasting note (2–3×/week, high)
4. Search for a specific wine by name or producer to check remaining quantity (as-needed, medium)
5. Update a wine's quantity when gifting a bottle (occasional, medium)

**Success Criteria:**
- Can create a complete wine record on a 375px iPhone screen in under 90 seconds
- Dashboard displays drink-now count and a "what to open" shelf that is accurate without manual refresh
- Tasting note entry after consuming a bottle takes fewer than 3 taps to reach and under 2 minutes to complete
- Zero need to open a spreadsheet for routine cellar questions

---

## PER-02: Claire Fontaine — Avid Cellar Builder & Long-Term Ager

**Role & Context:**
Claire is a 52-year-old operations consultant who has been seriously collecting wine for fifteen years. Her cellar holds approximately 300 bottles across a dedicated basement temperature-controlled unit (two 120-bottle racks), a Eurocave in the home office, and a commercial off-site storage locker. She buys primarily Burgundy, Barolo, and Napa Cabernet with explicit aging intent — many bottles won't be opened for 8–12 years. Claire maintains a detailed Excel workbook with custom formulas for drinking-window calculations, location columns, purchase price tracking, and vintage decade summaries. The spreadsheet works but breaks down on mobile, requires monthly manual formula checks to update readiness, and has no history of past tastings linked to the records. She wants a structured, reliable digital cellar that handles the drinking-window math automatically, makes location queries instant ("do I have a 2015 Barolo in the Eurocave?"), and preserves tasting history permanently. She is methodical and will not adopt a tool that feels approximate or loses data.

**Goals:**
- Track precise storage location for every bottle across multiple physical spaces so retrieval is instant (F2)
- See auto-calculated drinking-window badges without maintaining formula logic herself (F5)
- Record detailed tasting notes with structured sensory fields and a 100-point rating when she opens an aged bottle (F4)
- Get a collection breakdown by vintage decade and wine type to plan future purchases (F6)
- Filter the cellar list to "Hold" wines by location to know what not to touch for years (F3, F5)

**Pain Points:**
- Spreadsheet drinking-window formulas require manual updating and go stale when the file isn't opened for weeks (PRD §2)
- No structured storage tracking — bottles in different locations are managed across different spreadsheet tabs and frequently get out of sync (PRD §2)
- Tasting notes live in a separate Word document, not linked to the wine record, making it impossible to review them at purchase decision time (PRD §2)
- Spreadsheet is unusable on a phone in the basement when physically pulling bottles (PRD §2)

**Technical Expertise:** Advanced spreadsheet user; comfortable with structured web apps and forms; does not want to manage infrastructure but is willing to run a Docker command once at setup.

**Top Tasks:**
1. Filter the cellar list by location (e.g., "Basement Rack A") and drinking readiness (e.g., "Hold") to plan what to leave untouched (weekly, critical)
2. Check drinking-window badges on the dashboard and drink-now shelf to select a bottle for a special occasion (weekly, high)
3. Add a detailed tasting note with appearance, aroma, flavor, and finish fields plus a 100-point rating after opening an aged bottle (monthly, high)
4. Add a newly acquired case and assign precise storage location and drinking window (monthly, high)
5. Review collection dashboard breakdowns (by type, country, vintage decade) before a buying trip (quarterly, medium)

**Success Criteria:**
- Every bottle has a confirmed storage location; "Location Unknown" count stays at zero after initial setup
- Drinking-window badges recalculate accurately on every page load with no stale states
- Can filter to a specific location + readiness combination and get correct results in under 200 ms
- Full tasting note (all structured fields + 100-pt rating) can be saved without losing data on back-navigation
- Dashboard vintage-decade breakdown renders correctly for a 300+ bottle collection

---

## Persona Relationships

| Interaction | PER-01 Marcus (Casual) | PER-02 Claire (Avid) |
|---|---|---|
| **App usage frequency** | 3–5×/week, brief sessions (30–90 sec) | 1–2×/week, longer sessions (5–15 min) |
| **Primary entry point** | Dashboard drink-now shelf → bottle detail | Cellar list with filters → bottle detail |
| **Drives feature priority** | Mobile add-wine flow, quick consume log (F0, F1) | Location management, drinking-window filters (F2, F5) |
| **Overlapping needs** | Both need tasting notes (F4) and drinking-window badges (F5) | — |
| **Interaction with each other** | Not applicable — single-user app; personas represent different usage profiles of the same user type | — |

> **Note:** SimpleWineApp is a single-user app. PER-01 and PER-02 are not simultaneous users; they represent two distinct usage profiles and priority weightings that the same individual may embody at different points in their collecting journey, or two different people for whom the app must be equally compelling.

---

## Feature–Persona Matrix

| Feature | Description | PER-01 Marcus (Casual) | PER-02 Claire (Avid) |
|---|---|---|---|
| **F0** | Wine Inventory CRUD | **Primary** — core daily action; must be fast on mobile | **Primary** — large dataset; full field set required |
| **F1** | Quantity & Bottle Status | **Primary** — logs consumed/gifted bottles weekly | **Secondary** — uses occasionally; event log valued for history |
| **F2** | Storage Locations | **Secondary** — uses 1–2 locations; beneficial but not complex | **Primary** — multiple locations are central to cellar management |
| **F3** | Search & Filter | **Secondary** — uses search by name/producer; light filtering | **Primary** — heavy filter use (location + readiness + vintage) daily |
| **F4** | Tasting Notes & Ratings | **Primary** — quick notes after drinking; 5-star preferred | **Primary** — detailed structured notes; 100-point rating required |
| **F5** | Drinking Window | **Primary** — drink-now badge is the main decision signal | **Primary** — full badge spectrum (Hold, Approaching Peak) critical |
| **F6** | Collection Dashboard | **Primary** — default landing; drink-now shelf is primary nav | **Secondary** — uses breakdowns and highest-rated; not daily driver |

**Matrix Key:**
- **Primary** — Feature directly serves this persona's top tasks; must be excellent for them to adopt the app
- **Secondary** — Feature provides value but is not a daily driver for this persona
- **None** — Feature has no relevance to this persona

---

*Related documents: PRD-SimpleWineApp.md*
*Last updated: 2026-06-05*
