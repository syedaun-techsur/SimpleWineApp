---

## Screen 03: Add / Edit Wine Form (`/wines/new` and `/wines/[id]/edit`)

**Purpose:** Create or edit a wine record. Mobile-first form with inline validation, scrollable on 375px with no horizontal overflow.
**User Stories:** US-0.1, US-0.2, US-0.4, US-5.1
**Features:** F0, F2, F5

---

### Layout (Mobile 375px) — `/wines/new`

```
┌──────────────────────────────────────┐
│  ← Cancel              Add Wine      │  ← Header: "Add Wine" or "Edit Wine"
├──────────────────────────────────────┤
│                                      │
│  ─── REQUIRED FIELDS ───────────────  │
│                                      │
│  WINE NAME *                         │
│  ┌────────────────────────────────┐  │
│  │ e.g. Château Margaux           │  │
│  └────────────────────────────────┘  │
│  ← inline error appears here        │
│                                      │
│  PRODUCER *                          │
│  ┌────────────────────────────────┐  │
│  │ e.g. Château Margaux           │  │
│  └────────────────────────────────┘  │
│                                      │
│  VINTAGE YEAR *                      │
│  ┌────────────────────────────────┐  │
│  │ e.g. 2019           (1900–2027)│  │  ← Numeric, range hint
│  └────────────────────────────────┘  │
│  ← "Vintage must be between 1900    │
│      and 2027." (on error)          │
│                                      │
│  WINE TYPE *                         │
│  ┌─────────────────────────────▾──┐  │
│  │ Select wine type...            │  │  ← Dropdown
│  └────────────────────────────────┘  │
│  Options: Red / White / Rosé /       │
│  Sparkling / Dessert / Fortified /   │
│  Orange / Other                      │
│                                      │
│  QUANTITY *                          │
│  ┌────────────────────────────────┐  │
│  │ 1                (1–9999)      │  │
│  └────────────────────────────────┘  │
│                                      │
│  STORAGE LOCATION *                  │
│  ┌─────────────────────────────▾──┐  │
│  │ Select a storage location...   │  │  ← Dropdown from /api/locations
│  └────────────────────────────────┘  │
│  ← "Selected storage location no   │
│      longer exists. Choose another."│
│                                      │
│  ─── OPTIONAL DETAILS ─────────────  │  ← Divider (collapsed by default on mobile)
│  [▸ Show optional fields]            │  ← Expand/collapse toggle
│                                      │
│  (when expanded:)                    │
│  GRAPE VARIETY                       │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  COUNTRY                             │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  REGION                              │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  └────────────────────────────────┘  │
│                                      │
│  BOTTLE SIZE                         │
│  ┌─────────────────────────────▾──┐  │
│  │ 750ml (standard)               │  │  ← Dropdown with suggestions
│  └────────────────────────────────┘  │
│  Options: 375ml / 750ml /            │
│  Magnum 1.5L / Double Magnum 3L /    │
│  Jeroboam 4.5L / (type your own)     │
│                                      │
│  PURCHASE DATE                       │
│  ┌────────────────────────────────┐  │
│  │ YYYY-MM-DD                     │  │  ← Date picker (allow today, not future)
│  └────────────────────────────────┘  │
│                                      │
│  PURCHASE SOURCE                     │
│  ┌────────────────────────────────┐  │
│  │ e.g. Wine.com                  │  │
│  └────────────────────────────────┘  │
│                                      │
│  PURCHASE PRICE (per bottle)         │
│  ┌────────────────────────────────┐  │
│  │ $ 0.00                         │  │  ← Numeric, 2dp, non-negative
│  └────────────────────────────────┘  │
│                                      │
│  DRINKING WINDOW                     │
│  Drink From (Year)     Drink Until   │
│  ┌──────────────┐  ┌──────────────┐ │
│  │ e.g. 2025    │  │ e.g. 2045    │ │  ← Two numeric fields, side by side
│  └──────────────┘  └──────────────┘ │
│  ← "Drinking window end year must   │
│      be ≥ start year." (on error)   │
│                                      │
│  GENERAL NOTES                       │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                                │  │  ← Textarea, advisory counter
│  │                             0/2000│  │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Save Wine              │  │  ← Gold bg, Black text, 2px radius, uppercase
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel] ← text link               │
│                                      │
└──────────────────────────────────────┘
```

---

### Edit Mode Differences (`/wines/[id]/edit`)

- Header reads "Edit Wine" with wine name as subtitle
- All fields pre-populated from existing wine record
- Storage location selector pre-selects current location
- **Location Unknown state:** If wine's location was deleted, selector shows "Location Unknown — please select a new location" in `#EF4444`, field highlighted with red border
- Save button reads "Save Changes"
- Additional "Cancel" returns to `/wines/[id]` (not `/`)

```
┌──────────────────────────────────────┐
│  ← Château Margaux      Edit Wine    │
├──────────────────────────────────────┤
│                                      │
│  STORAGE LOCATION *                  │
│  ┌─────────────────────────────▾──┐  │
│  │ ⚠ Location Unknown —          │  │  ← Red border + warning text
│  │   please select a new location│  │
│  └────────────────────────────────┘  │
│  "Location Unknown — please select   │
│   a new location."                  │
│                                      │
└──────────────────────────────────────┘
```

---

### Field Layout & Validation

#### Required Fields (marked with *)

| Field | Input Type | Validation | Error Message |
|-------|-----------|-----------|---------------|
| Wine Name * | Text (max 255) | Non-empty after trim | "[Field] is required." |
| Producer * | Text (max 255) | Non-empty after trim | "[Field] is required." |
| Vintage Year * | Number | Integer 1900–(current+1) | "Vintage must be between 1900 and [year]." |
| Wine Type * | Select dropdown | One of 8 allowed values | "Select a valid wine type." |
| Quantity * | Number | Integer 1–9999 | "Quantity must be between 1 and 9999." |
| Storage Location * | Select dropdown | Valid location_id | "Selected storage location no longer exists. Please choose another." |

#### Optional Fields

| Field | Input Type | Validation | Constraint |
|-------|-----------|-----------|-----------|
| Grape Variety | Text | Max 255 chars | Optional |
| Country | Text | Max 100 chars | Optional |
| Region | Text | Max 100 chars | Optional |
| Bottle Size | Datalist/select | Max 50 chars | Optional; suggested values |
| Purchase Date | Date | Valid date, not future | Optional |
| Purchase Source | Text | Max 255 chars | Optional |
| Purchase Price | Number | ≥0, ≤2 decimal places, max 99999.99 | Optional |
| Drink From Year | Number | Integer ≥ 1900, ≤ 2100 | Optional |
| Drink Until Year | Number | Integer ≥ start year; ≥ 1900, ≤ 2100 | Optional; pair validation |
| General Notes | Textarea | Advisory 2000 chars (not enforced) | Optional |

---

### Inline Validation Behavior

- **Trigger:** On field blur (not on each keystroke for most fields)
- **Vintage:** Live validation on change (high-risk field on mobile — user gets instant feedback)
- **Drinking window:** Cross-field validation on End Year blur (if both fields have values)
- **Error display:** Red text below the input field (`#EF4444`), 12px Open Sans
- **Error icon:** Warning `⚠` prepended to error message
- **Field border:** `2px solid #EF4444` on invalid field
- **Submit blocked:** If any required field is empty or any field has validation error
- **Server errors (422):** Same inline display; field-level mapping from `fields` response object

```
VINTAGE YEAR *
┌────────────────────────────────┐
│ 1800                           │  ← Red border
└────────────────────────────────┘
⚠ Vintage must be between 1900 and 2027.   ← Red text, 12px
```

---

### No Locations Guidance State

When no storage locations exist (new user):
```
STORAGE LOCATION *
┌────────────────────────────────┐
│ (No locations available)       │  ← disabled dropdown
└────────────────────────────────┘
ℹ You haven't set up any storage locations yet.
  [Add your first storage location →]  ← links to /locations
```

The wine form can still be partially filled in. User is guided to create a location first.

---

### Optional Fields — Mobile Collapse/Expand

On mobile (375px):
- Required fields always visible
- Optional fields behind a toggle: "[▸ Show optional fields (10)]"
- Toggle expands all optional fields inline (not a new page)
- On Edit form: optional fields auto-expanded if any have values

On desktop (1024px+):
- All fields visible without toggle in a two-column layout
- Required fields in left column, optional in right column

---

### Desktop Layout (1024px+)

```
┌────────────────────────────────────────────────────────────┐
│  ← Cellar               Add Wine                           │
├─────────────────────────┬──────────────────────────────────┤
│                         │                                  │
│  REQUIRED FIELDS        │  OPTIONAL DETAILS                │
│                         │                                  │
│  WINE NAME *            │  GRAPE VARIETY                   │
│  [________________]     │  [________________]              │
│                         │                                  │
│  PRODUCER *             │  COUNTRY                         │
│  [________________]     │  [________________]              │
│                         │                                  │
│  VINTAGE YEAR *         │  REGION                          │
│  [________________]     │  [________________]              │
│                         │                                  │
│  WINE TYPE *            │  BOTTLE SIZE                     │
│  [▾ Select type    ]    │  [▾ 750ml          ]             │
│                         │                                  │
│  QUANTITY *             │  PURCHASE DATE                   │
│  [________________]     │  [________________]              │
│                         │                                  │
│  STORAGE LOCATION *     │  PURCHASE SOURCE                 │
│  [▾ Select location]    │  [________________]              │
│                         │                                  │
│                         │  PURCHASE PRICE                  │
│                         │  [$ _____________ ]              │
│                         │                                  │
│                         │  DRINKING WINDOW                 │
│                         │  From [______] Until [______]    │
│                         │                                  │
│                         │  GENERAL NOTES                   │
│                         │  [                           ]   │
│                         │  [                        0/2000]│
│                         │                                  │
│  [Save Wine]            │  [Cancel]                        │
└─────────────────────────┴──────────────────────────────────┘
```

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Required fields (name, producer, vintage, type, qty, location) | Top of form / left column |
| Primary | Save button | Bottom (mobile) / bottom-left (desktop) |
| Secondary | Validation errors (inline) | Adjacent to each field |
| Secondary | Drinking window fields | Optional section |
| Tertiary | Purchase details, general notes | Optional section |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (clean) | Empty required fields, dropdowns with placeholders | N/A |
| Edit (pre-filled) | All fields populated with current values | N/A |
| Validation error (single field) | Red border + red error text below field | Error message |
| Validation error (submit) | All invalid fields highlighted simultaneously | Focus jumps to first error |
| Location Unknown (edit) | Red border on location field, warning text | "Location Unknown — please select a new location" |
| No locations (new) | Location dropdown disabled, guidance link | "Add your first storage location →" |
| Submitting | Save button shows spinner, disabled | Button text: "Saving..." |
| Success | Redirect to /wines/[id] | Green toast: "Wine added!" or "Changes saved!" |
| Server error (422) | Inline errors from server | Per-field error messages |
| Server error (500) | Toast | "Could not save wine. Please try again." |
