---

## Flow 04: Location Management + Audit (JRN-02.3, US-2.1–2.4)

**User Story:** US-2.1, US-2.2, US-2.3, US-2.4
**Persona:** Claire Fontaine (PER-02)
**Trigger:** Claire receives a new case and needs to split it across locations; then audits counts
**Entry Point:** `/locations` (from nav) or FAB on locations page
**Exit Point:** `/` dashboard after verifying updated bottle totals

```
[Locations /locations]
    │
    ├── Location list loads: name, wine_count, action buttons
    │
    ▼  Scroll to "Add Location" form (or inline at top)
[Add Location input]
    │
    ├── Type name → POST /api/locations
    │       ├── 201: New row appears in list, wine_count = 0
    │       └── 409 (duplicate): Inline error "A location with that name already exists."
    │
    ▼  [Rename flow]
    ├── Tap "Rename" on a row → inline edit field replaces name text
    │       ├── Type new name → confirm → PUT /api/locations/[id]
    │       │       └── 200: Name updates in list (and on all wine records via FK)
    │       └── Tap "Cancel" → inline edit collapses, original name restored
    │
    ▼  [Delete flow]
    ├── Tap "Delete" on a row → Confirmation modal
    │       ├── 0 wines: "Delete '[name]'? This cannot be undone."
    │       ├── N wines: "Delete '[name]'? [N] wine(s) will be marked 'Location Unknown'."
    │       ├── Confirm → DELETE /api/locations/[id] → 204
    │       │       └── Row removed; affected wines show "Location Unknown"
    │       └── Cancel → modal closes, no change
    │
    ▼  [Drill-through to filtered cellar]
    ├── Tap location name (or wine_count link) → /cellar?pre-filter=location:[name]
    │       └── Cellar loads with Location chip pre-applied: [Basement Rack A ✕]
    │
    └── Navigate to / → dashboard shows updated total bottles (live DB query)
```

**Steps:**
1. **View list:** Locations listed alphabetically. Each row: name, wine count (e.g., "89 wines"), Rename button, Delete button. Empty state if none: "No storage locations yet. Add your first location below."
2. **Add location:** Inline form at top of the list — input + "Add" button. Submit on Enter or button tap. New row inserts at correct alphabetical position.
3. **Rename:** Tapping "Rename" replaces the name text with an inline input field. ESC or "Cancel" link aborts. Enter or "Save" confirms. Same uniqueness rules as create.
4. **Delete (no wines):** Simple confirmation. Single line modal, two buttons: "Delete" (destructive red) + "Cancel".
5. **Delete (wines assigned):** Warning modal with count. Two buttons. On confirm, wines get `location_id = NULL`; they now show "Location Unknown" on detail and list views.
6. **Drill-through:** Tapping the wine count number or location name navigates to `/cellar` with that location pre-filtered. Active filter chip visible immediately on the cellar list.
7. **Dashboard verification:** Back to `/` shows updated stats from live SQL query.

**Key Moments:**
- Inline rename (not a modal) keeps the location list in view — faster for a multi-location audit
- Wine count must be a tappable link to the filtered cellar — one-tap drill-through is the "aha" moment for Claire
- Delete confirmation modal content changes based on wine count — users must understand the consequence
- "Location Unknown" must be visibly surfaced on wine cards and detail pages after deletion (not silent)
