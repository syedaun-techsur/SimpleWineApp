---

## Flow 02: Log Consumed Bottle + Tasting Note (JRN-01.3, US-1.2, US-4.1, US-4.2)

**User Story:** US-1.2, US-1.3, US-4.1, US-4.2
**Persona:** Marcus Delgado (PER-01)
**Trigger:** Marcus just finished a bottle and wants to mark it consumed + add a quick rating
**Entry Point:** Dashboard "Recently Consumed" section OR `/cellar` search
**Exit Point:** `/wines/[id]` — detail page showing new note at top of notes list

```
[Dashboard /] or [Search /cellar]
    │
    ▼  Find the wine (recently consumed shortcut or text search)
[Wine Detail /wines/[id]]
    │
    ▼  Tap "−" (decrement) button
[Remove a Bottle — Bottom Sheet Modal]
    │
    ├── Select event type (required):
    │       [Consumed]  [Gifted]  [Opened]
    │       │
    │       ├── Optional: type note (500 char, with counter)
    │       │
    │       └── Tap "Confirm Removal"
    │               │
    │               ├── PATCH /api/wines/[id]/quantity { delta: -1, event_type: "Consumed" }
    │               │
    │               ▼  (event_type = Consumed or Gifted)
    │       [Post-consume prompt: "Add a tasting note?"]
    │               │
    │               ├── Tap "Yes" → Navigate to /wines/[id]/notes/new
    │               │       │
    │               │       ▼
    │               │   [Tasting Note Form]
    │               │       │
    │               │       ├── Rate (star widget) — first prominent field
    │               │       ├── Fill optional text fields (appearance/aroma/flavor/finish)
    │               │       ├── Select occasion, would-buy-again
    │               │       └── Tap "Save Note"
    │               │               │
    │               │               ▼
    │               │           POST /api/wines/[id]/notes
    │               │               │
    │               │               └── 201 → Redirect to /wines/[id]#notes
    │               │                       [New note appears at top]
    │               │
    │               └── Tap "Skip" → Dismiss, stay on /wines/[id]
    │
    └── (event_type = Opened) → No tasting note prompt. Return to /wines/[id]
```

**Steps:**
1. **Locate wine:** Dashboard "Recently Consumed" for last-used wines; or search in `/cellar` (debounced 150ms). Session state preserved.
2. **Tap "−":** Decrement button on wine card or detail page. If quantity = 0, button is disabled (greyed, aria-disabled).
3. **Bottom sheet modal appears:** Slides up from bottom. Three large tap-target buttons: Consumed / Gifted / Opened. Optional notes textarea below (500 char counter visible). Cancel link at bottom.
4. **Event type selection required:** "Confirm Removal" button is disabled until one event type is selected (grey/inactive state). On selection, button activates (Gold).
5. **Confirm:** API call fires. Quantity updates optimistically. Modal closes.
6. **Post-consume prompt (Consumed/Gifted only):** Inline prompt on detail page — not a full modal — slides in below quantity display. "Would you like to add a tasting note?" + "Yes" (Gold) + "Skip" (text link).
7. **Tasting note form:** Opens at `/wines/[id]/notes/new`. `tasted_on` pre-filled to today. Rating widget is the first, most prominent field (above all text fields). All text fields optional.
8. **Save and return:** Note appears at top of tasting notes list on `/wines/[id]`. Green toast: "Tasting note saved!"

**Key Moments:**
- Bottom sheet (not full-page modal) keeps context visible — lighter cognitive load for a routine action
- Event type button must be selected before Confirm activates — prevents accidental submission
- Post-consume prompt must NOT navigate away — inline prompt on current page
- Note form: rating is first field, everything else optional — enables 2-tap note (rate + save)
- Data loss on navigation is the #1 abandonment risk for Claire — form state preserved in sessionStorage
