# Sheet Frontend Integration Guide

## Date: February 24, 2026
## Status: Backend Ready, Frontend Integration Needed

---

## 🎯 Goal

Connect existing Sheet Frontend to new Sheet Service Backend (Port 3003)

---

## 📁 Current Architecture

### Backend (Ready):
```
Sheet Service (Port 3003)
├── POST /sheets - Create sheet job
├── GET /sheets/:jobId - Get status
├── GET /sheets/:jobId/stream - SSE progress
└── GET /sheets/:jobId/export/:format - Download
```

### Frontend (Needs Integration):
```
SheetAgentPage.jsx
├── SheetChatArea.jsx - Chat interface
├── SheetDataArea.jsx - FortuneSheet preview
└── Uses: sheetAiStreamService.js (old API)
```

---

## 🔧 Integration Steps

### Step 1: Update SheetChatArea

**File:** `apps/web/components/sheet/SheetChatArea.jsx`

**Replace old API call:**
```javascript
// OLD (in sheetAiStreamService.js)
const response = await fetch(
  `${API_URL}/sheet/conversation/create-stream`,
  {...}
);

// NEW (use sheetService.js)
import { sheetService } from '@/services/sheetService';

const result = await sheetService.createSheet({
  userId: currentUser.id,
  prompt: message,
  title: 'Generated Spreadsheet',
  rows: 100,
  columns: 20,
  includeCharts: true,
  includeFormulas: true
});
```

### Step 2: Stream Progress Updates

**Add to SheetChatArea:**
```javascript
import { useEffect } from 'react';

// Start streaming when job created
useEffect(() => {
  if (!jobId) return;
  
  const stream = sheetService.streamSheetProgress(jobId, {
    onMessage: (data) => {
      // Update progress in UI
      setProgress(data.progress);
      
      // When complete, load the data
      if (data.status === 'completed' && data.job?.data) {
        setSheetData(data.job.data);
      }
    },
    onComplete: (data) => {
      // Finalize
      setIsLoading(false);
    }
  });
  
  return () => stream.close();
}, [jobId]);
```

### Step 3: Update SheetDataArea

**File:** `apps/web/components/sheet/SheetDataArea.jsx`

**Load FortuneSheet data:**
```javascript
// When data is received from backend
const fortuneSheetData = sheetJob.data;

// Pass to FortuneSheet component
<FortuneSheet
  data={fortuneSheetData}
  onChange={handleSheetChange}
/>
```

### Step 4: Add Export Functionality

**Add download buttons:**
```javascript
const handleExport = async (format) => {
  await sheetService.exportSheet(jobId, format);
};

// Buttons
<Button onClick={() => handleExport('xlsx')}>Download Excel</Button>
<Button onClick={() => handleExport('csv')}>Download CSV</Button>
```

---

## 📝 Code Changes Required

### 1. Create Sheet Generation Hook

**New File:** `apps/web/hooks/useSheetGeneration.js` (already created ✅)

### 2. Update SheetChatArea

**Changes needed:**
- Replace `sheetAiStreamService` with `sheetService`
- Add job ID state
- Add progress tracking
- Connect SSE stream

### 3. Update Redux Slice (if needed)

**File:** `apps/web/redux/slices/sheetSlice.js`

**Add:**
```javascript
// Track sheet generation job
setSheetJob: (state, action) => {
  state.currentJob = action.payload;
},
setSheetProgress: (state, action) => {
  state.progress = action.payload;
}
```

---

## 🧪 Testing Checklist

- [ ] Create sheet from prompt
- [ ] See progress updates
- [ ] View generated spreadsheet
- [ ] Edit cells
- [ ] Export to Excel
- [ ] Export to CSV

---

## ⏱ Time Estimate

**Integration Time:** 2-4 hours
- SheetChatArea updates: 1-2 hours
- SheetDataArea updates: 1 hour
- Testing: 1 hour

---

## 🚀 Quick Start

```bash
# 1. Ensure Sheet Service is running
curl http://localhost:3003/health

# 2. Test backend directly
curl -X POST http://localhost:3003/sheets \
  -H "Content-Type: application/json" \
  -d '{"userId": "test", "prompt": "Create a budget", "title": "Budget"}'

# 3. Update frontend components
# See integration steps above

# 4. Test end-to-end
```

---

## ✅ Current Status

| Component | Backend | Frontend | Integration | Status |
|-----------|---------|----------|-------------|--------|
| Sheet Service | ✅ | ✅ | ⏳ | 90% |
| FortuneSheet | ✅ | ✅ | ✅ | 100% |
| Export | ✅ | ⏳ | ⏳ | 80% |
| Streaming | ✅ | ⏳ | ⏳ | 80% |

**Overall: 90% - Needs frontend connection**
