---

## Screen 04: Tasting Note Form (`/wines/[id]/notes/new`)

**Purpose:** Add a structured tasting note with rating. Reachable directly or from post-consume flow. Form state preserved on navigation.
**User Stories:** US-4.1, US-4.2, US-4.3, US-4.4
**Features:** F4

---

### Layout (Mobile 375px)

```
┌──────────────────────────────────────┐
│  ← Château Margaux    Add Tasting Note │  ← Header with wine name
├──────────────────────────────────────┤
│                                      │
│  ─── RATING & DATE ─────────────────  │
│                                      │
│  TASTING DATE *                      │
│  ┌────────────────────────────────┐  │
│  │ 2026-06-05  (today)            │  │  ← Pre-filled to today; date picker
│  └────────────────────────────────┘  │
│  ← "Tasting date cannot be in the   │
│      future." (on error)            │
│                                      │
│  RATING                              │
│  ★ ★ ★ ★ ☆                         │  ← 5-star widget (interactive)
│  OR if 100-point preference:         │
│  ┌────────────────────────────────┐  │
│  │ 94                  (1–100)    │  │  ← Numeric input
│  └────────────────────────────────┘  │
│                                      │
│  [Switch to 100-point ↗]            │  ← Small toggle link; or "Switch to 5-star"
│                                      │
│  WOULD BUY AGAIN                     │
│  ┌──────┐ ┌──────┐ ┌───────┐       │
│  │ Yes  │ │  No  │ │ Maybe │       │  ← Button group (single-select toggle)
│  └──────┘ └──────┘ └───────┘       │
│                                      │
│  OCCASION                            │
│  ┌─────────────────────────────▾──┐  │
│  │ Select occasion...             │  │  ← Dropdown
│  └────────────────────────────────┘  │
│  Options: Dinner / Gift / Casual /   │
│  Celebration / Restaurant /          │
│  Tasting / Other                     │
│                                      │
│  ─── TASTING NOTES ─────────────────  │
│                                      │
│  APPEARANCE                          │
│  ┌────────────────────────────────┐  │
│  │                                │  │  ← Textarea, optional
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  AROMA                               │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  FLAVOR                              │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  FINISH                              │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/1000│ │
│  └────────────────────────────────┘  │
│                                      │
│  GUEST FEEDBACK                      │
│  ┌────────────────────────────────┐  │
│  │                                │  │  ← Textarea, optional
│  │                             0/2000│ │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │         Save Note              │  │  ← Gold bg, Black text, 2px radius
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel] ← text link               │
│                                      │
└──────────────────────────────────────┘
```

---

### Rating Widget — 5-Star Mode

```
RATING
┌───────────────────────────────────────┐
│                                       │
│   ☆  ☆  ☆  ☆  ☆                    │  ← Unselected (empty state)
│                                       │
│   ★  ★  ★  ★  ☆                    │  ← 4 stars selected
│                                       │
└───────────────────────────────────────┘
```

- Stars: 40px × 40px touch target each
- Gold `#FBCA5C` fill for selected stars
- Muted `#D1D5DB` for empty stars
- Tap to select; tap same star again to clear rating
- Keyboard: left/right arrows to change value, spacebar to set
- ARIA: `role="radiogroup"` with 5 `role="radio"` elements

---

### Rating Widget — 100-Point Mode

```
RATING
┌─────────────────┐
│  94       /100  │  ← Number input
└─────────────────┘
⚠ Rating must be between 1 and 100.    ← On error
```

- Large touch-friendly number input
- Numeric keyboard on mobile
- Range displayed as hint text: "(1–100)"
- Toggle link below: "Switch to 5-star ↗"

---

### Rating Scale Toggle

The scale preference is a user setting (`user_settings.rating_scale`). The toggle:
- Lives below the rating widget as a small text link
- Text: "Switch to 100-point ↗" or "Switch to 5-star ↗"
- Tapping calls PATCH /api/settings and re-renders the rating widget immediately
- Previously entered rating value converted (e.g., 4 stars → 80 points) without data loss
- Visual: `#6B7280` link text, 12px Open Sans

---

### Would Buy Again — Button Group

```
WOULD BUY AGAIN
┌─────────┐  ┌─────────┐  ┌──────────┐
│   Yes   │  │   No    │  │  Maybe   │
└─────────┘  └─────────┘  └──────────┘
```

- Unselected: Bone bg, `#0A0A0A` border, `#0A0A0A` text
- Selected "Yes": `#10B981` bg, white text (green = positive)
- Selected "No": `#EF4444` bg, white text (red = negative)
- Selected "Maybe": `#F59E0B` bg, white text (amber = uncertain)
- 44px min height, buttons fill equal width across row
- Not required — user can skip selection

---

### Sensory Fields Design

Each of the four sensory fields (Appearance, Aroma, Flavor, Finish) follows the same pattern:

```
APPEARANCE                             ← JetBrains Mono uppercase, 11px, #9CA3AF
┌──────────────────────────────────┐
│ Deep ruby with violet rim...     │  ← Open Sans 14px
│                                  │
│                              68/ │
│                            1000  │  ← Character counter (right-aligned)
└──────────────────────────────────┘
```

- Textarea: auto-grows with content
- Character counter: shown from 0, turns `#EF4444` if over limit
- All sensory fields optional — no validation error if empty
- Fields are independently focusable (separate textareas, not one large blob)
- Vertical order: Appearance → Aroma → Flavor → Finish (logical tasting progression)

---

### Form State Preservation

Critical for Claire's use case (accidental navigation mid-note):

- All field values written to `sessionStorage` on every input event (key: `swa_note_draft_[wine_id]`)
- On page load, check `sessionStorage` for existing draft — if found, pre-populate fields with a notice: "ℹ We restored your unsaved draft."
- On successful save, clear the draft from `sessionStorage`
- On explicit Cancel, prompt: "Discard your unsaved note?" → "Discard" / "Keep Editing"
- On browser back button: same prompt (beforeunload where supported)

```
ℹ We restored your unsaved draft from your last session.
  [Discard draft] — text link

```

---

### Post-Consume Flow Integration (US-4.2)

When navigating from the bottle removal flow:
- `tasted_on` is pre-filled to today (the day of consumption)
- Small contextual note below the header: "Adding note for consumed bottle"
- No other differences from the direct flow

---

### Desktop Layout (1024px+)

```
┌───────────────────────────────────────────────────────────────┐
│  ← Château Margaux                     Add Tasting Note       │
├──────────────────────┬────────────────────────────────────────┤
│                      │                                        │
│  TASTING DATE *      │  APPEARANCE                            │
│  [2026-06-05]        │  [                                ]    │
│                      │  [                            0/1000]  │
│  RATING              │                                        │
│  ★ ★ ★ ★ ☆         │  AROMA                                 │
│  [Switch to 100-pt]  │  [                                ]    │
│                      │  [                            0/1000]  │
│  WOULD BUY AGAIN     │                                        │
│  [Yes] [No] [Maybe]  │  FLAVOR                                │
│                      │  [                                ]    │
│  OCCASION            │  [                            0/1000]  │
│  [▾ Select...    ]   │                                        │
│                      │  FINISH                                │
│                      │  [                                ]    │
│                      │  [                            0/1000]  │
│                      │                                        │
│  [Save Note]         │  GUEST FEEDBACK                        │
│  [Cancel]            │  [                                ]    │
│                      │  [                            0/2000]  │
└──────────────────────┴────────────────────────────────────────┘
```

Left column: date, rating, disposition, occasion, actions
Right column: sensory fields (more space for text entry)

---

### Information Hierarchy

| Priority | Content | Placement |
|----------|---------|-----------|
| Primary | Rating widget | Top of form, most prominent field |
| Primary | Tasting date | First field (required) |
| Primary | Save Note CTA | Bottom of left column / bottom of form |
| Secondary | Would Buy Again, Occasion | Below rating |
| Secondary | Appearance, Aroma, Flavor, Finish | Right column / main textarea section |
| Tertiary | Guest Feedback | Bottom of form |
| Tertiary | Rating scale toggle | Below rating widget |

---

### States

| State | Appearance | User Feedback |
|-------|------------|---------------|
| Default (new) | Date pre-filled today, rating empty, all text fields empty | N/A |
| Post-consume | Date pre-filled, contextual note shown | "Adding note for consumed bottle" |
| Draft restored | All fields populated from sessionStorage | "ℹ We restored your unsaved draft." |
| Tasting date in future | Red border + error below date field | "Tasting date cannot be in the future." |
| Rating out of range | Error below rating widget | "Rating must be between 1 and 5." / "...100." |
| Character limit exceeded | Counter turns red | No blocking — advisory only |
| Scale switch (in progress) | Rating widget re-renders with new scale | Value converted; no data loss |
| Submitting | Save button shows spinner, disabled | Button text: "Saving..." |
| Success | Redirect to /wines/[id]#notes | Green toast: "Tasting note saved!" |
| Server error | Toast | "Could not save tasting note. Please try again." |
| Cancel with unsaved data | Confirmation prompt | "Discard your unsaved note?" |

---

### Interactive Elements

| Element | Type | Behavior |
|---------|------|----------|
| Star rating widget | Interactive stars | Click to rate 1–5; click again to clear |
| Rating scale toggle | Text link | PATCH /api/settings; re-renders widget |
| Would Buy Again buttons | Toggle button group | Single-select; tap to select/deselect |
| Occasion dropdown | Select | One of 7 options |
| Tasting date input | Date picker | Native date input; restricts to today or earlier |
| Sensory textareas | Textarea | Auto-height; character counter |
| Save Note | Primary button | Client validate → POST /api/wines/[id]/notes |
| Cancel | Text link | Prompt if unsaved data; navigate to /wines/[id] |
