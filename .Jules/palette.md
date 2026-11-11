# Palette's UX & Accessibility Journal

## 2026-11-01 - Accessible Header Controls & Focus Visible Rings
**Learning:** In workstation/dashboard shells with icon-heavy headers, icon-only buttons (`button` with `<lucide-icon>`) lack accessible names for screen readers and miss state indicators like `aria-expanded` (for collapsible sidebars) and `aria-pressed` (for bookmark/favorite toggles). Additionally, default browser focus rings may get suppressed without explicit `focus-visible:ring-2 focus-visible:ring-brand-500` styles.
**Action:** Always complement icon-only header buttons with dynamic `aria-label`, explicit state attributes (`aria-expanded`, `aria-pressed`), and explicit Tailwind `focus-visible` styling.

## 2026-11-02 - Action Toolbar Accessibility on Compact Viewports
**Learning:** Shared toolbars that hide text labels at responsive breakpoints (e.g. `span.hidden.sm:inline`) become icon-only buttons on small viewports and mobile screens. Relying solely on `title` leaves screen readers and keyboard accessibility impaired unless explicit `aria-label` and toggle states like `aria-pressed` (such as fullscreen triggers) are present alongside `focus-visible:ring-2` keyboard rings.
**Action:** Whenever toolbar buttons conceal text labels responsively or render icon-only controls, always pair them with explicit, dynamic `aria-label` attributes and focus-visible keyboard styling.

## 2026-11-03 - Accessible Toast Container & Dismiss Focus Rings
**Learning:** Toast notification containers that only specify `aria-live="polite"` leave child toast cards without explicit semantics (`role="status"` vs `role="alert"`), and their close/dismiss buttons often omit accessible labels and visible keyboard focus rings. Icon-only dismiss buttons need dynamic context (`aria-label="Dismiss [Title]"`) and clear `focus-visible` styling so keyboard and screen reader users can navigate and dismiss notifications with confidence.
**Action:** Always annotate toast cards with appropriate roles (`role="alert"` for errors, `role="status"` for non-errors) and equip icon-only dismiss buttons with descriptive `aria-label` attributes and Tailwind `focus-visible:ring-2` focus rings.

## 2026-11-04 - Sidebar Category Accordion Accessibility and Focus Rings
**Learning:** Collapsible category headers in navigation sidebars rendered as `<button>` elements omit crucial assistive attributes (`aria-expanded`, `aria-controls`, and action-oriented `aria-label`/`title`), leaving screen reader users without knowledge of the section's expanded/collapsed state or the controlled panel ID. Furthermore, omitting `focus-visible:ring-2 focus-visible:ring-brand-500` leaves keyboard-only navigators unable to discern focus placement among densely packed menu sections.
**Action:** Always pair accordion buttons in navigation sidebars with dynamic `aria-expanded`, an explicit `aria-controls` pointing to the collapsible container ID, a descriptive action `aria-label`, and Tailwind `focus-visible` ring styling on both buttons and navigation links.

## 2026-11-05 - Dashboard Category Filter Tabs & Navigation Focus Rings
**Learning:** Category filter buttons that act like tab selectors must be grouped with `role="tablist"` and communicate selection via `role="tab"` and `[attr.aria-selected]`. Additionally, interactive workstation cards and filter pills frequently lack explicit `focus-visible:ring-2 focus-visible:ring-brand-500` styles, making keyboard navigation through the central dashboard invisible.
**Action:** Annotate filter strips with `role="tablist"` and `role="tab"` with dynamic `aria-selected` state, and ensure all dashboard interactive cards and buttons provide explicit focus-visible ring styles.

## 2026-11-10 - Search Combobox Accessible Active Descendant & Listbox Linking
**Learning:** Command palette and quick-search modal inputs annotated with `role="combobox"` require explicit `aria-controls` pointing to the results container ID (`role="listbox"`) and `[attr.aria-activedescendant]` referencing the currently focused item's ID. Without this link, assistive screen readers cannot announce the currently highlighted option during arrow key navigation, and omitting `aria-live="polite"` prevents announcements of dynamic search filtering.
**Action:** Always link combobox inputs to their listbox ID with `aria-controls`, bind `aria-activedescendant` to the highlighted item's unique DOM ID, and make results containers polite live regions with accessible focus states on shortcut items.

## 2026-11-11 - Shell Skip to Main Content Keyboard Bypass
**Learning:** In developer workstations with extensive sidebars and header controls (such as category lists, pinned tools, quick search trigger, and theme toggles), keyboard and screen reader users must tab through dozens of navigation links before reaching the primary tool workspace. Without an upfront skip link and matching target (`<main id="main-content" tabindex="-1">`), bypassing repetitive navigation is impossible.
**Action:** Position a `sr-only focus:not-sr-only` skip-to-content anchor tag as the first focusable child of the root workstation layout shell, pointing to `<main id="main-content" tabindex="-1">`.
