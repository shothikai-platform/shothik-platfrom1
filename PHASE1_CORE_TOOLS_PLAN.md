# Phase 1: Core Tools - Implementation Summary

**Date:** February 28, 2026  
**Status:** Analysis Complete - Ready for Implementation  
**Target:** shothik-platfrom1

---

## ✅ DISCOVERY: What's Already in shothiknew5

### Tool 1: Grammar Checker ✅ EXISTS
**Location:** `apps/web/app/(primary-layout)/grammar-checker/page.jsx`  
**Components:** `apps/web/components/(primary-layout)/(grammar-checker-page)/`  
**Service:** `apps/web/services/grammar-checker.service.ts`  
**Status:** Complete and functional

**Features:**
- Full Grammar Checker UI
- Language selection (English, French, Spanish, German, Bangla)
- Real-time grammar checking
- Corrections display
- Section management

---

### Tool 2: Paraphrase Tool ✅ EXISTS
**Location:** `apps/web/app/(primary-layout)/paraphrase/`  
**Components:** `apps/web/components/tools/paraphrase/`  
**Service:** `apps/web/services/paraphrase.service.ts`  
**Redux:** `apps/web/redux/slices/paraphraseHistorySlice.js`  
**Status:** Complete and functional

**Features:**
- Paraphrase editor
- Multiple modes (Standard, Fluency, Academic, Creative)
- Synonym levels (Basic, Intermediate, Advanced, Expert)
- Auto settings
- Output display
- History tracking

---

### Tool 3: AI Detector ✅ EXISTS (Partial)
**Location:** `apps/web/app/(primary-layout)/ai-detector/`  
**Components:** `apps/web/components/(primary-layout)/(ai-detector-page)/`  
**Backend:** `backend-services/ai-detector-onnx/` (100% complete)  
**Status:** UI exists, needs integration with backend

**Features:**
- File upload UI
- Text input
- Results display (needs connection to ONNX backend)

---

## 🎯 IMPLEMENTATION PLAN FOR shothik-platfrom1

Since all three tools already exist in shothiknew5, the implementation is:

### Option A: Copy & Adapt (Recommended)
Copy the working components from shothiknew5 to shothik-platfrom1 with minimal changes.

### Option B: API Gateway Integration
Instead of copying, create API routes in shothik-platfrom1 that proxy to shothiknew5 services.

---

## 📋 RECOMMENDED APPROACH: Hybrid

### Step 1: Grammar Checker (Day 1)
```bash
# Copy from shothiknew5 to shothik-platfrom1:
1. apps/web/app/(primary-layout)/grammar-checker/ → same path
2. apps/web/components/(primary-layout)/(grammar-checker-page)/ → same path
3. apps/web/components/tools/grammar/ → same path
4. apps/web/services/grammar-checker.service.ts → same path
5. Update API endpoint to use shothik-platfrom1 backend
```

### Step 2: Paraphrase Tool (Days 2-3)
```bash
# Copy from shothiknew5:
1. apps/web/app/(primary-layout)/paraphrase/ → same path
2. apps/web/components/tools/paraphrase/ → same path
3. apps/web/services/paraphrase.service.ts → same path
4. apps/web/redux/slices/paraphraseHistorySlice.js → same path

# Integration:
5. Connect to standalone paraphrase service via API gateway
6. OR integrate service into backend-services/
```

### Step 3: AI Detector UI (Days 4-5)
```bash
# Copy from shothiknew5:
1. apps/web/app/(primary-layout)/ai-detector/ → same path
2. apps/web/components/(primary-layout)/(ai-detector-page)/ → same path

# Integration:
3. Connect UI to existing ONNX backend (already in shothik-platfrom1)
4. Test file upload and text detection
```

### Step 4: Integration (Days 6-7)
```bash
1. Add tools to main navigation
2. Add tools to Writing Studio bubble menu
3. Test all three tools end-to-end
4. Fix any integration issues
```

---

## 🔧 TECHNICAL DETAILS

### Grammar Checker API Endpoint
```typescript
// Current in shothiknew5: POST /api/grammar/check
// Should be in shothik-platfrom1: same endpoint

interface GrammarCheckPayload {
  text: string;
  language?: string;
}

interface GrammarCheckResponse {
  success: boolean;
  data: {
    correctedText: string;
    corrections: Array<{
      original: string;
      suggestion: string;
      type: string;
    }>;
  };
}
```

### Paraphrase API Endpoint
```typescript
// Current in shothiknew5: POST /api/paraphrase
// Should connect to standalone service or internal API

interface ParaphrasePayload {
  text: string;
  mode: 'standard' | 'fluency' | 'academic' | 'creative';
  level: 'basic' | 'intermediate' | 'advanced' | 'expert';
  language?: string;
}

interface ParaphraseResponse {
  success: boolean;
  paraphrases: string[];
}
```

### AI Detector API Endpoint
```typescript
// Current: POST /api/ai-detector
// Backend: backend-services/ai-detector-onnx/ (already exists)

interface AIDetectorPayload {
  text?: string;
  file?: File;
}

interface AIDetectorResponse {
  success: boolean;
  isAI: boolean;
  confidence: number;
  score: number;
}
```

---

## 📁 FILES TO COPY/MODIFY

### Grammar Checker (12 files)
```
apps/web/app/(primary-layout)/grammar-checker/page.jsx
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/index.jsx
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/ActionMenu/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/ActionToolbar/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/EditorToolbar/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/GrammarIssueCard/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/GrammarSectionbar/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/GrammarSidebar/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/helpers/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/InitialInputActions/
apps/web/components/(primary-layout)/(grammar-checker-page)/GrammarCheckerContentSection/LanguageMenu/
apps/web/components/tools/grammar/LanguageMenu.jsx
apps/web/services/grammar-checker.service.ts
```

### Paraphrase Tool (8 files)
```
apps/web/app/(primary-layout)/paraphrase/page.jsx
apps/web/components/tools/paraphrase/ParaphraseContend.jsx
apps/web/components/tools/paraphrase/ParaphraseOutput.jsx
apps/web/components/tools/paraphrase/ParaphraseAutoSettingsOptions.jsx
apps/web/components/tools/paraphrase/ParaphraseEditor.jsx
apps/web/components/tools/paraphrase/AutoParaphraseSettings.jsx
apps/web/services/paraphrase.service.ts
apps/web/redux/slices/paraphraseHistorySlice.js
```

### AI Detector (4 files)
```
apps/web/app/(primary-layout)/ai-detector/page.jsx
apps/web/components/(primary-layout)/(ai-detector-page)/AIDetectorContentSection/
apps/web/components/tools/aidetector/
apps/web/services/ai-detector.service.ts (create if missing)
```

---

## 🚀 QUICK START COMMANDS

```bash
# Navigate to shothiknew5 (source)
cd /root/.openclaw/workspace/shothiknew5

# Copy Grammar Checker
cp -r apps/web/app/\(primary-layout\)/grammar-checker \
  /path/to/shothik-platfrom1/apps/web/app/\(primary-layout\)/

cp -r apps/web/components/\(primary-layout\)/\(grammar-checker-page\) \
  /path/to/shothik-platfrom1/apps/web/components/\(primary-layout\)/

cp -r apps/web/components/tools/grammar \
  /path/to/shothik-platfrom1/apps/web/components/tools/

cp apps/web/services/grammar-checker.service.ts \
  /path/to/shothik-platfrom1/apps/web/services/

# Copy Paraphrase Tool
cp -r apps/web/app/\(primary-layout\)/paraphrase \
  /path/to/shothik-platfrom1/apps/web/app/\(primary-layout\)/

cp -r apps/web/components/tools/paraphrase \
  /path/to/shothik-platfrom1/apps/web/components/tools/

cp apps/web/services/paraphrase.service.ts \
  /path/to/shothik-platfrom1/apps/web/services/

cp apps/web/redux/slices/paraphraseHistorySlice.js \
  /path/to/shothik-platfrom1/apps/web/redux/slices/

# Copy AI Detector
cp -r apps/web/app/\(primary-layout\)/ai-detector \
  /path/to/shothik-platfrom1/apps/web/app/\(primary-layout\)/

cp -r apps/web/components/\(primary-layout\)/\(ai-detector-page\) \
  /path/to/shothik-platfrom1/apps/web/components/\(primary-layout\)/

cp -r apps/web/components/tools/aidetector \
  /path/to/shothik-platfrom1/apps/web/components/tools/
```

---

## ✅ VERIFICATION CHECKLIST

After copying, verify:

- [ ] All imports resolve correctly
- [ ] API endpoints are configured
- [ ] Services connect to correct backends
- [ ] Redux slices are registered
- [ ] Navigation links work
- [ ] Tools appear in Writing Studio bubble menu
- [ ] No console errors
- [ ] All three tools functional

---

## 🎯 NEXT STEPS

1. **Execute the copy commands** above
2. **Fix import paths** if needed
3. **Configure API endpoints** for each tool
4. **Test each tool** individually
5. **Integrate into Writing Studio**
6. **Deploy and verify**

---

**Ready to execute Phase 1?**
