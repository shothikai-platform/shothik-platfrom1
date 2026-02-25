---
name: stem-service-hardening
description: Production-harden Shothik AI services for STEM researchers. Use when auditing, fixing, or building any tool service (AI Detector, Paraphrase, Humanize GPT, etc.) to ensure reliability, proper error handling, and STEM content awareness.
---

# STEM Service Hardening Skill

Systematic production hardening playbook for Shothik AI services. Apply when working on any of the 12 services.

## Pre-Hardening Audit Checklist

### 1. Console Error Scan
Search for broken `console.log` artifacts — a known pattern across the codebase:
```bash
# Find broken console statements (missing function calls)
grep -n "console\.\(log\|warn\|error\)" <file> | head -20
```

Common broken patterns to fix:
- `console.log(` followed by object property syntax without `console.log(`
- Orphaned `)` on next lines
- Debug logging left in production code

**Fix**: Remove all debug `console.log` statements. Keep only `console.error` for genuine error paths.

### 2. API Timeout Handling
Every API call MUST have:
- **AbortController** with 5-minute timeout
- **AbortSignal** passed to the request
- Cleanup on component unmount

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min

try {
  const response = await api.post(endpoint, payload, { signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

### 3. Error Message Standards
- NEVER expose raw API error messages to users
- Map technical errors to user-friendly messages
- Use toast notifications for transient errors
- Use `role="alert"` components for persistent errors

Error mapping pattern:
```javascript
const error = err?.data;
if (/LIMIT_REQUEST|PACAKGE_EXPIRED/.test(error?.error)) {
  dispatch(setShowAlert(true));
  dispatch(setAlertMessage(error?.message));
} else if (error?.error === "UNAUTHORIZED") {
  dispatch(setShowLoginModal(true));
} else {
  toast.error(error?.message || "Something went wrong. Please try again.");
}
```

### 4. Event Tracking
- Verify `trackEvent` calls use correct service name (not another service's name)
- Pattern: `trackEvent("click", "<service-name>", "<service-name>_click", 1)`

## STEM Preprocessing Integration

### When to Apply
Add STEM preprocessing to any service that processes user text where LaTeX/code content could cause issues:
- AI Detector (false positives on technical writing)
- Paraphrase (preserve formulas)
- Humanize GPT (don't alter code blocks)

### How to Integrate
```typescript
import { preprocessText } from '@/services/stemPreprocessor';

// In the component
const preprocessResult = useMemo(() => {
  return preprocessText(inputText, {
    detectLatex: excludeLatex,
    detectCode: excludeCode,
    stripReferences: excludeReferences,
    stripQuotes: excludeQuotes,
  });
}, [inputText, excludeLatex, excludeCode, excludeReferences, excludeQuotes]);

// Send preprocessResult.processedText to API instead of raw text
```

### Key Files
- `src/services/stemPreprocessor.ts` — Core preprocessing logic
- `src/services/citationDetector.ts` — Citation pattern detection
- `src/hooks/useCitationAnalysis.ts` — Citation analysis hook

## Service-Specific Patterns

### Redux Integration
Each service typically has:
- RTK Query mutations in `src/redux/api/tools/toolsApi`
- A Redux slice in `src/redux/slices/`
- Service functions in `src/services/`

### Session Storage Pattern
Some services use `sessionStorage` for cross-page content passing:
```javascript
sessionStorage.setItem("ai-detect-content", JSON.stringify(text));
router.push("/ai-detector");
```

### Word/Character Limits
- Use `useWordLimit(serviceName)` hook for package-based limits
- Show `UsesLimitBar` component when no input present
- Validate minimum character counts before submission

## Post-Hardening Verification

1. Page loads without console errors
2. API calls have timeout handling
3. Error messages are user-friendly
4. No debug logging in production paths
5. Event tracking uses correct service name
6. Loading states show proper feedback
7. Component unmount cleans up resources
