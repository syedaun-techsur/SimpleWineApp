---

## Flow 01: Choose What to Drink Tonight (JRN-01.2)

**User Story:** US-5.2, US-6.1, US-6.2, US-4.3
**Persona:** Marcus Delgado (PER-01)
**Trigger:** Marcus opens the app at 6:30 pm wanting to find a bottle to open
**Entry Point:** App launch → `/` dashboard
**Exit Point:** App closed (wine decision made from detail page)

```
[App Launch → Dashboard /]
    │
    ├── Dashboard loads <1s (server-rendered)
    │       │
    │       ▼
    │   [Drink Now stat tile: "8 DRINK NOW"]
    │   [Drink Now shelf: horizontal scroll cards]
    │
    ▼  Scroll shelf / scan cards (wine name, rating visible)
    │
    ├── Tap a Drink Now shelf card
    │       │
    │       ▼
    │   [Wine Detail /wines/[id]]
    │       │
    │       ├── Rating visible in header section (no scroll required)
    │       ├── Storage location visible (Marcus knows which rack)
    │       └── Tasting notes show prior ratings → confidence to decide
    │
    └── Decision made → App closed
```

**Steps:**
1. **App opens on Dashboard:** Server-rendered — no loading skeleton for >500ms. Drink Now count tile is above the fold at 375px.
2. **Scan Drink Now shelf:** Horizontal scroll row, cards show: wine name (truncated at 1 line), producer (muted), vintage, Drink Now badge, and most-recent star rating (★★★★☆). At least 2.5 cards visible at 375px (peek pattern signals scrollability).
3. **Browse candidates:** Marcus scrolls the shelf. Rating visible on each card removes the need to tap in to compare.
4. **Tap a card:** Opens `/wines/[id]`. Readiness badge + rating are in the hero section (first visible block, no scroll required). Storage location shown prominently.
5. **Confirm decision:** Prior tasting notes are visible below hero. Marcus sees "4 stars – April 2025" and makes his choice.
6. **Exit:** Closes app. No logging action required for this flow.

**Key Moments:**
- Dashboard must load within 1s on warm container — cold blank state kills the flow
- Rating on shelf cards is critical — without it Marcus must tap each wine individually
- First 2-3 shelf cards visible without scroll (peek at 375px signals more)
- Wine detail hero section: badge + rating + location all visible above the fold at 375px
