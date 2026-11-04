# Palette's UX & Accessibility Journal

## 2026-11-01 - Accessible Header Controls & Focus Visible Rings
**Learning:** In workstation/dashboard shells with icon-heavy headers, icon-only buttons (`button` with `<lucide-icon>`) lack accessible names for screen readers and miss state indicators like `aria-expanded` (for collapsible sidebars) and `aria-pressed` (for bookmark/favorite toggles). Additionally, default browser focus rings may get suppressed without explicit `focus-visible:ring-2 focus-visible:ring-brand-500` styles.
**Action:** Always complement icon-only header buttons with dynamic `aria-label`, explicit state attributes (`aria-expanded`, `aria-pressed`), and explicit Tailwind `focus-visible` styling.

## 2026-11-02 - Action Toolbar Accessibility on Compact Viewports
**Learning:** Shared toolbars that hide text labels at responsive breakpoints (e.g. `span.hidden.sm:inline`) become icon-only buttons on small viewports and mobile screens. Relying solely on `title` leaves screen readers and keyboard accessibility impaired unless explicit `aria-label` and toggle states like `aria-pressed` (such as fullscreen triggers) are present alongside `focus-visible:ring-2` keyboard rings.
**Action:** Whenever toolbar buttons conceal text labels responsively or render icon-only controls, always pair them with explicit, dynamic `aria-label` attributes and focus-visible keyboard styling.
