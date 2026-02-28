import { Router } from "express";

const router = Router();

// Grammar check endpoint
router.post("/check", async (req, res) => {
  try {
    const { text, language = "en" } = req.body;

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Text is required" });
    }

    // Simple grammar rules (in production, use NLP library like compromise.js)
    const issues = [];

    // Rule 1: Double spaces
    const doubleSpaceRegex = /\s{2,}/g;
    let match;
    while ((match = doubleSpaceRegex.exec(text)) !== null) {
      issues.push({
        id: `issue_${match.index}`,
        type: "style",
        message: "Multiple spaces detected",
        suggestion: " ",
        startIndex: match.index,
        endIndex: match.index + match[0].length,
        context: text.slice(Math.max(0, match.index - 10), match.index + match[0].length + 10),
        severity: "low",
      });
    }

    // Rule 2: Common typos
    const commonTypos = [
      { wrong: "teh", correct: "the" },
      { wrong: "adn", correct: "and" },
      { wrong: "taht", correct: "that" },
      { wrong: "wiht", correct: "with" },
      { wrong: "fro", correct: "for" },
      { wrong: "ot", correct: "to" },
      { wrong: "si", correct: "is" },
      { wrong: "ti", correct: "it" },
    ];

    for (const typo of commonTypos) {
      const regex = new RegExp(`\\b${typo.wrong}\\b`, "gi");
      while ((match = regex.exec(text)) !== null) {
        issues.push({
          id: `typo_${match.index}`,
          type: "spelling",
          message: `Possible typo: "${typo.wrong}"`,
          suggestion: typo.correct,
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          context: text.slice(Math.max(0, match.index - 10), match.index + match[0].length + 10),
          severity: "high",
        });
      }
    }

    // Rule 3: Missing capitalization after period
    const sentenceRegex = /\.\s+([a-z])/g;
    while ((match = sentenceRegex.exec(text)) !== null) {
      issues.push({
        id: `cap_${match.index}`,
        type: "grammar",
        message: "Sentence should start with capital letter",
        suggestion: match[1].toUpperCase(),
        startIndex: match.index + 2,
        endIndex: match.index + 3,
        context: text.slice(Math.max(0, match.index - 10), match.index + 20),
        severity: "medium",
      });
    }

    // Generate corrections
    const corrections = issues.map((issue) => ({
      original: text.slice(issue.startIndex, issue.endIndex),
      corrected: issue.suggestion,
      explanation: issue.message,
    }));

    // Generate corrected text
    let correctedText = text;
    // Apply corrections in reverse order to maintain indices
    [...issues]
      .sort((a, b) => b.startIndex - a.startIndex)
      .forEach((issue) => {
        correctedText =
          correctedText.slice(0, issue.startIndex) +
          issue.suggestion +
          correctedText.slice(issue.endIndex);
      });

    res.json({
      success: true,
      text,
      issues,
      corrections,
      correctedText,
      stats: {
        issueCount: issues.length,
        spellingIssues: issues.filter((i) => i.type === "spelling").length,
        grammarIssues: issues.filter((i) => i.type === "grammar").length,
        styleIssues: issues.filter((i) => i.type === "style").length,
      },
    });
  } catch (error) {
    console.error("Grammar check error:", error);
    res.status(500).json({ error: "Failed to check grammar" });
  }
});

export default router;
