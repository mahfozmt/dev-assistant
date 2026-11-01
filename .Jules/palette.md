# Palette's UX & Accessibility Journal

## 2026-11-01 - Accessible Header Controls & Focus Visible Rings
**Learning:** In workstation/dashboard shells with icon-heavy headers, icon-only buttons (`button` with `<lucide-icon>`) lack accessible names for screen readers and miss state indicators like `aria-expanded` (for collapsible sidebars) and `aria-pressed` (for bookmark/favorite toggles). Additionally, default browser focus rings may get suppressed without explicit `focus-visible:ring-2 focus-visible:ring-brand-500` styles.
**Action:** Always complement icon-only header buttons with dynamic `aria-label`, explicit state attributes (`aria-expanded`, `aria-pressed`), and explicit Tailwind `focus-visible` styling.
