import { Router } from "express";
import { getSlideProcessor } from "../shared/job-processor";

const router = Router();
const processor = getSlideProcessor();

// Parallel slide generation
router.post("/generate", async (req, res) => {
  const { 
    topic, 
    slides = [], 
    template = "default",
    options = {} 
  } = req.body;
  
  try {
    // Submit slide generation job (limited concurrency due to GPU)
    const result = await processor.submit("slide", {
      topic,
      slides,
      template,
      options,
    }, options.priority || 7); // Higher priority for slides
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Parallel batch slide generation
router.post("/generate-batch", async (req, res) => {
  const { presentations } = req.body;
  
  if (!Array.isArray(presentations)) {
    return res.status(400).json({ error: "Presentations array is required" });
  }
  
  try {
    // Submit all presentations in parallel (with concurrency control)
    const jobs = presentations.map((pres, index) =>
      processor.submit("slide", {
        topic: pres.topic,
        slides: pres.slides,
        template: pres.template,
        batchIndex: index,
      }, pres.priority || 5)
    );
    
    const results = await Promise.all(jobs);
    
    res.json({
      presentations: results,
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Parallel slide content generation with checkpointing
router.post("/generate-with-checkpoints", async (req, res) => {
  const { topic, numSlides = 5, template = "default" } = req.body;
  
  try {
    // Generate outline first
    const outline = await processor.submit("slide", {
      type: "generate_outline",
      topic,
      numSlides,
    }, 8);
    
    // Checkpoint 1: Outline complete
    const checkpoint1 = Date.now();
    
    // Generate slides in parallel
    const slideJobs = outline.slides.map((slide: any, index: number) =>
      processor.submit("slide", {
        type: "generate_slide",
        slide,
        index,
        template,
        outline,
      }, 6)
    );
    
    const slides = await Promise.all(slideJobs);
    
    // Checkpoint 2: Slides complete
    const checkpoint2 = Date.now();
    
    // Generate speaker notes in parallel
    const notesJobs = slides.map((slide: any, index: number) =>
      processor.submit("slide", {
        type: "generate_notes",
        slide,
        index,
      }, 4)
    );
    
    const notes = await Promise.all(notesJobs);
    
    // Final checkpoint
    const checkpoint3 = Date.now();
    
    res.json({
      topic,
      outline,
      slides: slides.map((s, i) => ({
        ...s,
        notes: notes[i],
      })),
      checkpoints: {
        outline: checkpoint1,
        slides: checkpoint2,
        notes: checkpoint3,
      },
      totalTime: checkpoint3 - checkpoint1,
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Get processor stats
router.get("/stats", async (req, res) => {
  const stats = processor.getStats();
  res.json(stats);
});

export default router;
