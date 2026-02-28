# Phase 1: Core Tools Implementation Plan

## Tools to Implement
1. Grammar Checker
2. Paraphrase Tool  
3. AI Detector UI

## Implementation Order
1. Grammar Checker (simplest, 1 day)
2. AI Detector UI (backend exists, 1 day)
3. Paraphrase Tool (most complex, 2-3 days)

## Files to Create

### Grammar Checker
- app/(tools)/grammar-checker/page.tsx
- components/tools/grammar/GrammarChecker.tsx
- lib/services/grammar.ts

### AI Detector
- app/(tools)/ai-detector/page.tsx
- components/tools/ai-detector/AIDetector.tsx
- lib/services/ai-detector.ts

### Paraphrase
- app/(tools)/paraphrase/page.tsx
- components/tools/paraphrase/ParaphraseTool.tsx
- lib/services/paraphrase.ts

## Key Features

### Grammar Checker
- Real-time checking
- Multi-language support
- Correction suggestions
- One-click apply

### AI Detector
- Text upload
- File upload (PDF, DOC)
- ONNX backend integration
- Probability scores

### Paraphrase
- Multiple modes
- Synonym levels
- Freeze words
- Streaming output
