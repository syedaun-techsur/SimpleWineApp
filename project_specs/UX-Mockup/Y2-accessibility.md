---

## Y2: Accessibility Notes (WCAG 2.1 AA)

---

### Color Contrast Requirements

All foreground/background color pairs must meet WCAG 2.1 AA minimum: **4.5:1 for normal text**, **3:1 for large text (18px+ or 14px+ bold)** and UI components.

| Pairing | Foreground | Background | Ratio | Pass? |
|---------|-----------|-----------|-------|-------|
| Body text | `#0A0A0A` | `#FAFAF7` (Bone) | 19.9:1 | ✓ AAA |
| Muted text | `#6B7280` | `#FAFAF7` | 5.9:1 | ✓ AA |
| Very muted text | `#9CA3AF` | `#FAFAF7` | 3.9:1 | ✗ FAIL for normal text |
| Very muted text (large) | `#9CA3AF` | `#FAFAF7` | 3.9:1 | ✓ for 18px+ |
| Gold on Black | `#FBCA5C` | `#0A0A0A` | 9.8:1 | ✓ AAA |
| White on Black | `#FFFFFF` | `#0A0A0A` | 21:1 | ✓ AAA |
| White on Drink Now green | `#FFFFFF` | `#10B981` | 2.5:1 | ✗ FAIL |
| Black on Drink Now green | `#0A0A0A` | `#10B981` | 8.4:1 | ✓ AA |
| White on Hold blue | `#FFFFFF` | `#3B82F6` | 3.1:1 | ✓ AA (large text / UI) |
| Black on Approaching Peak amber | `#0A0A0A` | `#F59E0B` | 7.1:1 | ✓ AAA |
| White on Past Window grey | `#FFFFFF` | `#6B7280` | 3.0:1 | ✓ AA (large text / UI) |
| Black on No Window muted | `#0A0A0A` | `#9CA3AF` | 5.2:1 | ✓ AA |
| White on Consumed red | `#FFFFFF` | `#EF4444` | 3.9:1 | ✓ AA (large) |
| White on Gifted purple | `#FFFFFF` | `#8B5CF6` | 3.9:1 | ✓ AA (large) |
| Black on Opened orange | `#0A0A0A` | `#F97316` | 5.5:1 | ✓ AA |
| Error text | `#EF4444` | `#FAFAF7` | 4.5:1 | ✓ AA |
| Gold chip text | `#FBCA5C` | `#0A0A0A` | 9.8:1 | ✓ AAA |

**Action items:**
- Badge text for Drink Now: use **black `#0A0A0A`** (not white) — white fails on `#10B981`
- Badge text for Hold: use white with font size ≥14px bold (meets 3:1 for UI components)
- `#9CA3AF` muted text: restrict to 18px+ or 14px+ bold contexts only (section labels, hints)

---

### Semantic HTML

| Element | Required Semantic |
|---------|------------------|
| Page titles | `<h1>` per page (e.g., "My Cellar", "Add Wine") |
| Section headings | `<h2>` for "Drink Now", "Tasting Notes", etc. |
| Wine cards | `<article>` or `<li>` within `<ul>` |
| Location list | `<ul>` with `<li>` per location |
| Forms | `<form>` with associated `<label>` for every input |
| Navigation | `<nav>` with `aria-label="Main navigation"` |
| Bottom tab bar | `<nav aria-label="Primary navigation">` with `<a>` and `aria-current="page"` |
| Modals | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to modal title |
| Filter chips | `<button type="button">` with `aria-label="Remove [filter name] filter"` |
| Stat tiles | `<a>` (tappable link) with descriptive text: "47 total bottles — view cellar" |
| Error messages | `role="alert"` or `aria-live="polite"` for inline validation |
| Readiness badge | `<span>` with text content (not icon-only) |

---

### Keyboard Navigation

| Feature | Keyboard Behavior |
|---------|-----------------|
| General | Tab/Shift+Tab cycles through all interactive elements in DOM order |
| Wine cards | Enter/Space activates the card link (navigates to detail) |
| [+] / [−] buttons | Enter/Space activates; focused with Tab |
| Star rating | Left/Right arrows change value; Space sets; focus visible on each star |
| Filter checkboxes | Space toggles; Arrow keys move within a group |
| Bottom sheet modal | Opens on Enter/Space on [−]; focus moves into modal; Tab trapped; Escape closes |
| Delete modal | Focus moves to Cancel button on open; Tab between Cancel and Delete; Escape = Cancel |
| Inline rename | Enter saves; Escape cancels |
| Sort dropdown | Arrow keys to navigate options; Enter to select |
| Search bar | Standard text input; results update as typed |

**Focus management rules:**
- Opening a modal: focus moves to the first focusable element inside the modal (typically Cancel button for destructive actions)
- Closing a modal: focus returns to the element that triggered the modal
- Page navigation: focus moves to the `<h1>` of the new page
- Form submit error: focus moves to the first invalid field

**Focus indicator:**
- Visible on all interactive elements
- Style: `2px solid #FBCA5C` (Gold) outline with `2px offset` — visible on both light and dark backgrounds
- Never `outline: none` without a custom focus style replacement

---

### ARIA Labels

| Element | ARIA Attribute |
|---------|---------------|
| Search input | `aria-label="Search your wine collection"` |
| Filter toggle button | `aria-expanded="true/false"` + `aria-controls="filter-panel"` |
| Filter panel | `id="filter-panel"` + `role="region"` + `aria-label="Filter options"` |
| Filter chip remove button | `aria-label="Remove Readiness: Hold filter"` |
| [−] quantity button | `aria-label="Remove one bottle of [wine name]"` |
| [+] quantity button | `aria-label="Add one bottle of [wine name]"` |
| Disabled [−] at qty 0 | `aria-disabled="true"` + `aria-label="Cannot remove bottle: none remaining"` |
| Readiness badge | `role="status"` or `<span>` with text (no icon-only badges) |
| Cellar Empty badge | Text must read "CELLAR EMPTY" (visible text, not just icon) |
| Would Buy Again buttons | `role="radiogroup"` with 3 `role="radio"` children |
| Star rating widget | `role="radiogroup"` `aria-label="Rating"` with 5 `role="radio"` stars |
| Delete confirmation modal | `role="dialog"` `aria-modal="true"` `aria-labelledby="modal-title"` |
| Loading/submitting state | `aria-busy="true"` on form element; spinner has `role="status"` `aria-label="Saving..."` |
| Toast notifications | `role="alert"` (error/urgent) or `role="status"` (success) |
| "Back to Cellar" link | `aria-label="Back to My Cellar"` |
| Result count | `aria-live="polite"` region — announced on filter change |

---

### Screen Reader Considerations

**Wine cards in cellar list:**
- Each card `<article>` should have `aria-label="[Wine Name], [Vintage], [Wine Type], [Location], [Readiness badge], [Rating], [Quantity] bottles"`
- Avoids ambiguous "button" labels without context

**Quantity controls:**
- Both [−] and [+] buttons should announce the new quantity after action: use `aria-live="polite"` on the quantity display element
- Example: quantity display `<span aria-live="polite" aria-atomic="true">3</span>` — screen reader announces "3" when value changes

**Readiness badges:**
- Text content must be the full badge name ("DRINK NOW", "HOLD", etc.)
- Not just color — color alone is insufficient for WCAG 1.4.1 (Use of Color)

**Tasting note form:**
- Character counters: `aria-live="polite"` so screen readers announce the count as user types
- Example: `<span aria-live="polite">68 of 1000 characters</span>`

**Filter chips:**
- When a chip is added: announce "Filter added: [dimension] [value]" via `aria-live="polite"`
- When a chip is removed: announce "Filter removed: [dimension] [value]"

**Delete confirmation:**
- Modal title read first on focus
- "This cannot be undone" must be in the modal body (not as a tooltip)

---

### Motion & Animation

- All CSS transitions/animations: respect `prefers-reduced-motion: reduce`
- Bottom sheet slide-up: skip animation if reduced motion preferred (show instantly)
- Toast slide-in: same
- Filter panel expand: same
- Provide no "blink" or rapid flashing elements

```css
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.001ms !important;
    animation-duration: 0.001ms !important;
  }
}
```

---

### Form Accessibility

- Every input has a visible `<label>` (not placeholder-only)
- Required fields: `aria-required="true"` + visual asterisk `*`
- Asterisk explained: footnote "* Required field" at form top
- Error state: `aria-invalid="true"` on invalid input + `aria-describedby` pointing to error message `<span>`
- Error message ID pattern: `error-[field-name]` (e.g., `error-vintage`)

```html
<!-- Example valid pattern -->
<label for="vintage">Vintage Year *</label>
<input
  id="vintage"
  type="number"
  aria-required="true"
  aria-invalid="true"
  aria-describedby="error-vintage"
/>
<span id="error-vintage" role="alert">
  ⚠ Vintage must be between 1900 and 2027.
</span>
```

---

### WCAG 2.1 Checklist Summary

| Criterion | Level | Status | Notes |
|-----------|-------|--------|-------|
| 1.1.1 Non-text content | A | ✓ | Alt text on all icons; badges have text |
| 1.3.1 Info and relationships | A | ✓ | Semantic HTML structure |
| 1.3.3 Sensory characteristics | A | ✓ | Badges not color-only (text names) |
| 1.4.1 Use of color | A | ✓ | Event type and readiness use text + color |
| 1.4.3 Contrast (minimum) | AA | ✓ | See table above; black on green badge |
| 1.4.4 Resize text | AA | ✓ | Responsive layout, no fixed text sizes |
| 1.4.10 Reflow | AA | ✓ | Single-column at 375px, no horizontal scroll |
| 1.4.11 Non-text contrast | AA | ✓ | Button borders, input borders meet 3:1 |
| 2.1.1 Keyboard | A | ✓ | All interactive elements keyboard accessible |
| 2.1.2 No keyboard trap | A | ✓ | Modals trap focus but allow Escape |
| 2.4.1 Bypass blocks | A | ✓ | Skip-to-content link at page top |
| 2.4.3 Focus order | A | ✓ | DOM order = visual order |
| 2.4.4 Link purpose | A | ✓ | Descriptive link text / aria-labels |
| 2.4.7 Focus visible | AA | ✓ | Gold outline on all focused elements |
| 2.5.3 Label in name | A | ✓ | Button text matches accessible name |
| 2.5.5 Target size | AAA | ✓ (target) | 44px minimum touch targets |
| 3.1.1 Language of page | A | ✓ | `lang="en"` on `<html>` |
| 3.3.1 Error identification | A | ✓ | Inline errors adjacent to fields |
| 3.3.2 Labels or instructions | A | ✓ | Labels + hints on all inputs |
| 4.1.2 Name, role, value | A | ✓ | ARIA attributes per table above |
| 4.1.3 Status messages | AA | ✓ | `role="alert"` on toasts and errors |
