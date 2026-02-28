import { Router } from "express";
import { getResearchProcessor } from "../shared/job-processor";
import { Mutex } from "async-mutex";

const router = Router();
const processor = getResearchProcessor();

// Cache for deduplication
const resultCache = new Map<string, any>();
const cacheMutex = new Mutex();

// Parallel research from multiple sources
router.post("/research", async (req, res) => {
  const { query, sources = ["arxiv", "semantic_scholar"], options = {} } = req.body;
  
  if (!query) {
    return res.status(400).json({ error: "Query is required" });
  }
  
  const cacheKey = `research:${query}:${sources.sort().join(",")}`;
  
  // Check cache (with mutex for thread safety)
  const cached = await cacheMutex.runExclusive(() => resultCache.get(cacheKey));
  if (cached) {
    return res.json({ ...cached, cached: true });
  }
  
  try {
    // Submit parallel research job
    const result = await processor.submit("research", {
      query,
      sources,
      options,
    }, options.priority || 5);
    
    // Cache result
    await cacheMutex.runExclusive(() => {
      resultCache.set(cacheKey, result);
      // Limit cache size
      if (resultCache.size > 1000) {
        const firstKey = resultCache.keys().next().value;
        resultCache.delete(firstKey);
      }
    });
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Parallel synthesis of research results
router.post("/synthesize", async (req, res) => {
  const { results, synthesisType = "summary" } = req.body;
  
  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: "Results array is required" });
  }
  
  try {
    // Use Fork-Join pattern
    const synthesis = await Promise.all(
      results.map(async (result, index) => {
        // Parallel synthesis of each result
        return processor.submit("research", {
          type: "synthesize_chunk",
          data: result,
          index,
          synthesisType,
        }, 3);
      })
    );
    
    // Combine synthesized chunks
    const combined = {
      summary: synthesis.map(s => s.summary).join("\n\n"),
      keyPoints: synthesis.flatMap(s => s.keyPoints || []),
      sources: synthesis.flatMap(s => s.sources || []),
    };
    
    res.json(combined);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get research job status
router.get("/status/:jobId", async (req, res) => {
  const stats = processor.getStats();
  res.json({
    jobId: req.params.jobId,
    status: "processing", // Simplified - would track actual job status
    queuePosition: stats.queued,
    estimatedWait: stats.averageWaitTime,
  });
});

// Cancel research job
router.delete("/cancel/:jobId", async (req, res) => {
  const cancelled = await processor.cancelJob(req.params.jobId);
  res.json({ cancelled });
});

export default router;
