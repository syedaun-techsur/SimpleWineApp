---

## Flow 00: Add a New Wine (JRN-01.1)

**User Story:** US-0.1, US-0.2, US-5.1
**Persona:** Marcus Delgado (PER-01)
**Trigger:** Marcus is at a wine shop and taps "+ Add Wine" from the dashboard or FAB
**Entry Point:** `/` dashboard → FAB or "Add Wine" button
**Exit Point:** `/wines/[id]` — new wine detail page

```
[Dashboard /]
    │
    ▼  Tap "+ Add Wine" (FAB or dashboard CTA)
[Wine Form /wines/new]
    │
    ├── Fill required fields (name, producer, vintage, type, qty, location)
    │       │
    │       ├── Validation error → Inline error adjacent to field (stay on form)
    │       │
    │       └── Tap "Save Wine"
    │               │
    │               ├── Client validation pass → POST /api/wines
    │               │       │
    │               │       ├── 201 Created → Redirect to /wines/[id]
    │               │       │       └── [Success toast: "Wine added to your cellar!"]
    │               │       │
    │               │       └── 422 Server error → Inline field errors shown
    │               │
    │               └── Client validation fail → Field errors shown, no API call
    │
    └── Tap "Cancel" → Navigate back to /
```

**Steps:**
1. **Trigger:** User taps "+ Add Wine" FAB (mobile) or nav button. FAB is positioned in primary thumb zone — bottom-right, 56px above bottom tab bar.
2. **Form loads:** `/wines/new` renders instantly. Storage location `<select>` populates from `GET /api/locations`. If no locations exist, inline guidance appears: "You have no storage locations yet. [Add one first →]" with the location field highlighted.
3. **User fills fields:** Required fields (starred) first: name, producer, vintage, type, quantity, location. Optional fields below a visual divider ("Optional Details").
4. **Inline validation fires on blur** for each field (not on each keystroke for required fields). Vintage validates range 1900–(current year+1) immediately.
5. **User taps "Save Wine":** Full client-side validation runs. Any errors shown inline. If clean, `POST /api/wines` fires.
6. **Success:** Redirect to `/wines/[id]` with a green success toast: "Wine added to your cellar!" (auto-dismiss 4s). Total Bottles stat on dashboard updates on next visit.
7. **Cancel:** "Cancel" link (not button) in top-right of form header navigates back without API call.

**Key Moments (from journey analysis):**
- FAB must be in thumb zone — if not immediately visible, Marcus will close the app
- Vintage field: large touch target (44px min), numeric keyboard on mobile, live range validation
- Location dropdown pre-populated; if empty, guided nudge rather than hard block
- Success confirmation must be immediate and visible (toast + redirect to detail)
