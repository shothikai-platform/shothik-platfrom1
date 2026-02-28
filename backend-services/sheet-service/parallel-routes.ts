import { Router } from "express";
import { getSheetProcessor } from "../shared/job-processor";

const router = Router();
const processor = getSheetProcessor();

// Parallel cell generation for large sheets
router.post("/generate", async (req, res) => {
  const { 
    rows = 10, 
    cols = 5, 
    data = {},
    options = {} 
  } = req.body;
  
  try {
    // Submit sheet generation job with high parallelism
    const result = await processor.submit("sheet", {
      rows,
      cols,
      data,
      options,
    }, options.priority || 5);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Parallel formula calculation
router.post("/calculate", async (req, res) => {
  const { cells, formulas } = req.body;
  
  if (!cells || !formulas) {
    return res.status(400).json({ error: "Cells and formulas are required" });
  }
  
  try {
    // Parallel calculation of independent formulas
    const independentFormulas = formulas.filter((f: any) => !f.dependencies?.length);
    const dependentFormulas = formulas.filter((f: any) => f.dependencies?.length);
    
    // Calculate independent formulas in parallel
    const independentResults = await Promise.all(
      independentFormulas.map((formula: any) =>
        processor.submit("sheet", {
          type: "calculate_formula",
          formula,
          cells,
        }, 5)
      )
    );
    
    // Update cells with independent results
    const updatedCells = { ...cells };
    independentResults.forEach((result: any) => {
      updatedCells[result.cellId] = result.value;
    });
    
    // Calculate dependent formulas in order
    const dependentResults = [];
    for (const formula of dependentFormulas) {
      const result = await processor.submit("sheet", {
        type: "calculate_formula",
        formula,
        cells: updatedCells,
      }, 5);
      dependentResults.push(result);
      updatedCells[result.cellId] = result.value;
    }
    
    res.json({
      cells: updatedCells,
      calculated: independentResults.length + dependentResults.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Batch update cells
router.post("/batch-update", async (req, res) => {
  const { updates } = req.body;
  
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: "Updates array is required" });
  }
  
  try {
    // Process updates in parallel batches
    const batchSize = 50;
    const batches = [];
    
    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize);
      batches.push(
        processor.submit("sheet", {
          type: "batch_update",
          updates: batch,
        }, 4)
      );
    }
    
    const results = await Promise.all(batches);
    
    res.json({
      updated: results.reduce((sum, r) => sum + r.updated, 0),
      batches: batches.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

export default router;
