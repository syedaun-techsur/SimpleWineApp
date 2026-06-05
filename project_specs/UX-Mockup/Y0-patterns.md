---

## Y0: Interaction Patterns

---

### Pattern 1: Remove a Bottle — Bottom Sheet Modal

**When to use:** User taps [−] on a wine detail page or cellar card (quantity > 0)
**Components:** US-1.2, US-4.2

```
┌──────────────────────────────────────┐
│ ──────── (drag handle)               │
│                                      │
│  Remove a Bottle                     │  ← Montserrat 900 18px
│  Château Margaux 2015               │  ← Wine name in subheading
│                                      │
│  What happened to this bottle?       │
│                                      │
│  ┌──────────┐ ┌──────────┐ ┌──────┐ │
│  │ Consumed │ │  Gifted  │ │Opened│ │  ← Event type buttons (required)
│  └──────────┘ └──────────┘ └──────┘ │
│  (no selection = all outline)        │
│  (selected = Gold bg, Black text)    │
│                                      │
│  NOTES (optional)                    │
│  ┌────────────────────────────────┐  │
│  │                                │  │
│  │                             0/500│ │
│  └────────────────────────────────┘  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │     Confirm Removal            │  │  ← Disabled (grey) until type selected
│  └────────────────────────────────┘  │
│                                      │
│  [Cancel]                            │  ← Text link, closes sheet
│                                      │
└──────────────────────────────────────┘
```

**Behavior:**
1. Sheet slides up from bottom (translateY animation, 200ms ease-out)
2. Background: `rgba(0,0,0,0.5)` scrim, non-scrollable
3. Event type: MUST select one before "Confirm Removal" becomes active
4. "Confirm Removal" disabled state: `#9CA3AF` bg, white text, not clickable
5. "Confirm Removal" active state: Gold `#FBCA5C` bg, `#0A0A0A` text
6. Tapping scrim or [Cancel]: closes sheet, no action
7. On confirm: PATCH request fires; sheet closes; quantity updates; tasting note prompt appears (Consumed/Gifted only)

---

### Pattern 2: Tasting Note Prompt (Post-Consume)

**When to use:** After Consumed or Gifted bottle event is confirmed
**User Story:** US-4.2

```
┌──────────────────────────────────────┐
│                                      │
│  🍷 Bottle marked as consumed!       │
│     Château Margaux 2015             │
│                                      │
│  Would you like to add a             │
│  tasting note?                       │
│                                      │
│  ┌──────────────┐  [Skip]           │
│  │  Add a Note  │                   │  ← "Add a Note": Gold, "Skip": text link
│  └──────────────┘                   │
│                                      │
└──────────────────────────────────────┘
```

**Behavior:**
- Appears inline below the quantity display on wine detail page (not a full modal)
- Slides in from below the quantity row (slideDown animation)
- "Add a Note": navigates to `/wines/[id]/notes/new`
- "Skip": dismisses the prompt (height collapses), page returns to normal state
- Prompt does NOT appear after an "Opened" event

---

### Pattern 3: Delete Confirmation Modal

**When to use:** User taps "Delete Wine" on wine detail, or "Delete" on a location row
**User Stories:** US-0.5, US-2.4

```
┌──────────────────────────────────────┐
│ ████████████████████████████████████ │  ← Scrim
│ ██  ┌────────────────────────┐  ████ │
│ ██  │                        │  ████ │
│ ██  │  Delete "Wine Name"?   │  ████ │  ← Title
│ ██  │                        │  ████ │
│ ██  │  This cannot be        │  ████ │
│ ██  │  undone. All tasting   │  ████ │
│ ██  │  notes and bottle      │  ████ │
│ ██  │  events will also be   │  ████ │
│ ██  │  deleted.              │  ████ │
│ ██  │                        │  ████ │
│ ██  │  [Cancel]  [Delete]    │  ████ │
│ ██  └────────────────────────┘  ████ │
└──────────────────────────────────────┘
```

**Behavior:**
- Modal: Bone bg, 16px radius (modal exception), 20px padding, max-width 340px
- [Cancel]: outline button, closes modal
- [Delete]: `#EF4444` bg, white text, uppercase
- Focus trapped in modal (Tab cycles between Cancel and Delete)
- ESC key closes modal (same as Cancel)
- Scrim click: does NOT close (prevents accidental dismissal of destructive action)
- On confirm: API call → success → redirect; toast on completion

---

### Pattern 4: Active Filter Chips

**When to use:** One or more filters active on `/cellar`
**User Story:** US-3.2, US-3.4

```
Active Filters:
┌────────────────────────┐
│ WINE TYPE: Red  ✕      │  │  LOCATION: Basement Rack A  ✕  │  │  READINESS: Hold  ✕  │
└────────────────────────┘
[Clear All]
```

**Chip design:**
- `#0A0A0A` background, `#FBCA5C` text (Gold on Black = 19.4:1 contrast — AAA)
- 2px radius, 8px horizontal padding, 24px height
- ✕ icon: 16px, 44px touch target (with padding)
- Chips row: horizontally scrollable (overflow-x: auto, scrollbar hidden)
- Order: stable (chips don't rearrange on add/remove)
- "Clear All": text link, `#EF4444`, always at end of row

**Behavior:**
- Tapping ✕ on a chip: removes that specific filter only; list re-renders
- "Clear All": removes all chips AND clears search text; resets sessionStorage keys
- Adding a new chip: appends to the end of the row; row scrolls to reveal new chip

---

### Pattern 5: Inline Validation

**When to use:** Form fields with validation rules (wine form, tasting note form, location form)
**User Stories:** US-0.2, US-5.1

```
VINTAGE YEAR *
┌────────────────────────────────┐
│ 1850                           │  ← Field with red border
└────────────────────────────────┘
⚠ Vintage must be between 1900 and 2027.
```

**Rules:**
- Trigger: on field blur (FocusOut event) for most fields
- Vintage and drinking window: validate on change (high-risk real-time feedback)
- Error: `#EF4444` text, 12px Open Sans, appears immediately below field
- Prepend `⚠` character to error message
- Field border changes to `2px solid #EF4444`
- On correction: error clears on next valid input (on Change after first error shown)
- Submit: validates all fields; focuses first error field; scrolls to it

---

### Pattern 6: Quantity Controls

**When to use:** On wine cards in `/cellar` and wine detail page
**User Stories:** US-1.1, US-1.2, US-1.4

```
Normal:          [−]   3   [+]
Cellar Empty:    [−]   0   [+]
                  ↑ disabled (greyed)
Max (9999):      [−]  9999 [+]
                              ↑ disabled
```

**Design:**
- [−] and [+]: 44px × 44px minimum touch target
- [−] button: `#0A0A0A` bg, white `−` text (when active)
- [+] button: `#0A0A0A` bg, white `+` text (when active)
- Disabled state: `#9CA3AF` bg, `#FFFFFF` text, `aria-disabled="true"`, `cursor: not-allowed`
- Quantity number: Open Sans Bold 18px, centered between buttons
- Optimistic UI: quantity updates immediately on [+]; modal gates [−]

---

### Pattern 7: Toast Notifications

**When to use:** After successful or failed API operations

**Success toast:**
```
┌─────────────────────────────────────────────┐
│ ✓  Wine added to your cellar!               │
└─────────────────────────────────────────────┘
```
- `#10B981` left border (4px), Bone bg
- Auto-dismiss after 4 seconds
- Position: top-center (mobile), top-right (desktop)
- Can be dismissed by tapping

**Error toast:**
```
┌─────────────────────────────────────────────┐
│ ✕  Could not save wine. [Retry]             │
└─────────────────────────────────────────────┘
```
- `#EF4444` left border (4px), Bone bg
- Does NOT auto-dismiss (user must act)
- [Retry] link re-triggers the failed action

---

### Pattern 8: Empty States

Each empty state pairs an explanation with a clear next action.

| Screen / Section | Empty State Copy | CTA |
|-----------------|-----------------|-----|
| `/cellar` (no wines) | "Your cellar is empty." | "[Add your first wine →]" |
| `/cellar` (no filter match) | "No wines match your current filters." | "[Clear All Filters]" |
| Dashboard — Drink Now shelf | "No wines are ready to drink right now." | (no CTA — informational) |
| Dashboard — Recently Added | "No wines added yet." | "[Add your first wine →]" |
| Dashboard — Recently Consumed | "No consumption events recorded yet." | (no CTA) |
| Dashboard — Highest Rated | "Add tasting notes and ratings to see your top wines here." | (no CTA) |
| Wine detail — Tasting Notes | "No tasting notes yet." | "[Add a Tasting Note →]" |
| Wine detail — Bottle History | (section hidden entirely) | N/A |
| `/locations` (no locations) | "No storage locations yet. Add your first location above." | (inline form is already present) |

**Empty state design:**
- Centered in the section area
- Muted text: `#9CA3AF`, Open Sans 14px italic
- CTA: standard Gold text link
- No illustrations in MVP (text-only empty states)
