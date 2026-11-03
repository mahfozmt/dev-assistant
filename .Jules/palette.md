# Palette's UX & Accessibility Journal

## 2026-11-01 - Accessible Header Controls & Focus Visible Rings
**Learning:** In workstation/dashboard shells with icon-heavy headers, icon-only buttons (`button` with `<lucide-icon>`) lack accessible names for screen readers and miss state indicators like `aria-expanded` (for collapsible sidebars) and `aria-pressed` (for bookmark/favorite toggles). Additionally, default browser focus rings may get suppressed without explicit `focus-visible:ring-2 focus-visible:ring-brand-500` styles.
**Action:** Always complement icon-only header buttons with dynamic `aria-label`, explicit state attributes (`aria-expanded`, `aria-pressed`), and explicit Tailwind `focus-visible` styling.

## 2026-11-03 - Accessible Modal Command Palettes & Comboboxes
**Learning:** Command palette modals require explicit WAI-ARIA dialog semantics (`role="dialog"`, `aria-modal="true"`, `aria-label`) along with combobox semantics (`role="combobox"`, `aria-autocomplete="list"`, `aria-expanded="true"`) so assistive technologies recognize the search overlay context. Icon-only action buttons (such as query clear buttons) inside the palette require explicit `aria-label` and `focus-visible` ring indicators, and interactive list items need `role="option"` and `aria-selected` to reflect active arrow-key navigation.
**Action:** Pair modal command search overlays with dialog and combobox semantics, clear query action labels, and keyboard focus-visible rings for seamless non-mouse navigation.
