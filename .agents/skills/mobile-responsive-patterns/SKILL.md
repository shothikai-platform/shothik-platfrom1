---
name: mobile-responsive-patterns
description: Implement mobile-responsive patterns for Shothik AI tools. Use when adding mobile layouts, tab navigation, responsive toggles, or touch-friendly interactions. Targets tablet users in university labs (South/Southeast Asia market).
---

# Mobile Responsive Patterns Skill

Standard patterns for making Shothik AI tools work well on tablets and mobile devices. Primary target: researchers on tablets in university computer labs.

## Screen Size Detection

### Standard Hook
```javascript
import useScreenSize from "@/hooks/ui/useScreenSize";

const { width } = useScreenSize();
const isMobile = width <= 1024; // Tablet breakpoint
```

### Alternative
```javascript
import useResponsive from "@/hooks/ui/useResponsive";

const isMobile = useResponsive("down", "sm");
const isTablet = useResponsive("between", "md", "xl");
```

## Tab-Based Navigation Pattern

For tools with editor + results panels, use tab navigation on mobile:

### Tab Bar Structure
```jsx
{isMobile && (
  <div className="mb-3 flex w-full rounded-xl bg-muted/50 p-1 shadow-sm"
       role="tablist" aria-label="Tool views">
    <button
      id="editor-tab"
      role="tab"
      aria-selected={mobileTab === "editor"}
      aria-controls="editor-panel"
      tabIndex={mobileTab === "editor" ? 0 : -1}
      className={cn(
        "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        mobileTab === "editor"
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setMobileTab("editor")}
    >
      Editor
    </button>
    <button
      id="results-tab"
      role="tab"
      aria-selected={mobileTab === "results"}
      aria-controls="results-panel"
      tabIndex={mobileTab === "results" ? 0 : -1}
      className={cn(
        "flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
        mobileTab === "results"
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => setMobileTab("results")}
    >
      Results
    </button>
  </div>
)}
```

### Panel Visibility
```jsx
<div
  id="editor-panel"
  role="tabpanel"
  aria-labelledby="editor-tab"
  className={cn(
    "flex min-h-0 flex-col",
    isMobile ? (mobileTab === "editor" ? "flex-1" : "hidden") : "h-full"
  )}
>
```

### Auto-Switch on Results
```javascript
useEffect(() => {
  if (isMobile && result) {
    setMobileTab("results");
  }
}, [result, isMobile]);
```

### Cross-Tab Navigation
When clicking highlights in editor → switch to results tab:
```javascript
const handleHighlightClick = useCallback((matchId) => {
  if (isMobile) setMobileTab("results");
  document.getElementById(matchId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}, [isMobile]);
```

When clicking source in results → switch to editor tab:
```javascript
const handleSectionClick = useCallback((matchId) => {
  if (isMobile) setMobileTab("editor");
  setTimeout(() => {
    const el = document.querySelector(`[data-match-id="${matchId}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, isMobile ? 100 : 0); // Delay for tab switch animation
}, [isMobile]);
```

## Responsive Layout Patterns

### Two-Panel → Stacked
```jsx
<div className={cn(
  "flex gap-3",
  isMobile ? "flex-col" : "flex-row"
)}>
```

### Responsive Padding
```jsx
className={cn(
  isMobile ? "px-2 py-2 sm:px-4" : "px-4 py-2"
)}
```

### Responsive Toggle Bar
```jsx
<div className={cn(
  "flex shrink-0 flex-wrap items-center gap-3 border-b",
  isMobile ? "gap-2 px-2 py-2 sm:px-4" : "px-4 py-2"
)}>
```

## Touch Target Requirements

- Minimum 44x44px for all interactive elements
- Buttons: Use `size="lg"` variants on mobile
- Toggle switches: Wrap label + switch in single clickable area
- Accordion triggers: Full-width tap area

## Mobile-Specific Height Calculations

### Standard Tool Heights
```jsx
className={cn(
  result && width <= 1024
    ? "h-[calc((100vh-340px)/2)] max-h-[500px] min-h-[500px]"
    : "h-[calc(100vh-328px)] max-h-[600px] min-h-[400px]",
  "lg:h-[calc(100vh-280px)] lg:max-h-[600px] lg:min-h-[400px]",
)}
```

## Result Badge on Tab
Show count badge when results are available:
```jsx
Results
{hasResults && (
  <span className="bg-primary/10 text-primary ml-1.5 rounded-full px-1.5 py-0.5 text-xs">
    {resultCount}
  </span>
)}
```
