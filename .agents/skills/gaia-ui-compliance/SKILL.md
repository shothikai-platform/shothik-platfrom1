---
name: gaia-ui-compliance
description: Enforce Gaia UI design system compliance for Shothik AI components. Use when building or auditing UI components to ensure they follow the established design tokens, spacing, accessibility, dark mode, and animation standards. Target quality score 9/10.
---

# Gaia UI Compliance Skill

Ensures all Shothik AI components follow the Gaia UI design system. Apply these rules when creating new components, auditing existing ones, or reviewing pull requests.

## Design Token Rules

### Colors — CSS Variables Only
- NEVER use hardcoded hex/rgba colors (e.g., `#000000`, `rgba(0,0,0,0.5)`)
- USE semantic tokens: `text-foreground`, `bg-card`, `text-muted-foreground`, `border-border`
- Dark mode palette: `zinc` (NOT `slate` or `gray`)
- Always provide `dark:` variants for any custom styling

### Typography
- Font: Manrope (brand font, intentional deviation from Gaia's Inter)
- Use `text-sm`, `text-base`, `text-lg` — avoid arbitrary sizes
- Text colors must use CSS variables: `color: inherit` for highlighted text

## Surface & Border Rules

### Flat Design Philosophy
- NO explicit `border` classes on cards — use `bg-muted/50 shadow-sm` instead
- Cards: `rounded-xl` minimum
- Badges: `rounded-full`
- Exception: Borders acceptable for dividers (`border-b`, `border-t`) and form inputs

### Spacing Standards
- Cards: `p-6` minimum padding
- Touch targets: 44px minimum (critical for tablet users in university labs)
- Section gaps: `space-y-6` between major sections, `gap-3` between items
- Toggle/Switch components: Wrap in larger clickable area if default < 44px

## Accessibility Checklist

### ARIA Requirements
- All interactive elements: `aria-label` required
- Dynamic content updates: `aria-live="polite"`
- Error states: `role="alert"`
- Tab navigation: Complete WAI-ARIA wiring (`role="tablist"/"tab"/"tabpanel"`, `id`, `aria-controls`, `aria-selected`, `tabIndex`)
- Editors/textareas: `role="textbox"` and `aria-label`

### Reduced Motion
- CSS: `@media (prefers-reduced-motion: reduce)` to disable transitions
- Framer Motion: Check `useReducedMotion()` hook, skip animations when true

## Animation Standards

### Framer Motion Defaults
- Spring animations: `stiffness: 300, damping: 30` baseline
- Entrance: `initial={{ opacity: 0, y: 8 }}` → `animate={{ opacity: 1, y: 0 }}`
- Duration: 200-300ms for micro-interactions, 400-600ms for page transitions
- Always wrap in reduced-motion check

## Dark Mode Rules

### Critical
- NEVER use `color: #000000` in highlight/decoration CSS (invisible on dark backgrounds)
- USE `color: inherit` or CSS variable equivalents
- Test all components in both light and dark mode
- Dark backgrounds use `zinc-800`/`zinc-900`, NOT `slate-800`/`gray-800`

## Component Patterns

### Cards
```jsx
<div className="bg-card rounded-xl shadow-sm p-6">
  {/* Content */}
</div>
```

### Error States
```jsx
<div role="alert" className="bg-destructive/10 text-destructive rounded-xl p-4">
  {/* Error message */}
</div>
```

### Loading States
```jsx
<div role="status" aria-live="polite" className="flex items-center gap-2">
  <Loader2 className="h-4 w-4 animate-spin" />
  <span>Processing...</span>
</div>
```

## Quality Score Dimensions

| Dimension | Target | Key Metric |
|-----------|--------|------------|
| Design tokens | 9/10 | Zero hardcoded colors |
| Animation | 9/10 | Springs + reduced-motion |
| Color hierarchy | 9/10 | Semantic meaning preserved |
| Borders & surfaces | 9/10 | Flat design, no outlines |
| Accessibility | 9/10 | All ARIA attributes present |
| Dark mode | 9/10 | No visibility issues |
| Mobile | 9/10 | 44px touch targets, responsive |
