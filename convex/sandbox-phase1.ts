// OpenSandbox Integration for Shothik
// Phase 1: Core Sandboxes - Backend Actions

import { action } from "./_generated/server";
import { v } from "convex/values";

const OPEN_SANDBOX_URL = process.env.OPEN_SANDBOX_URL || "http://opensandbox-server.opensandbox:8080";

// ============================================
// CODE EXECUTION SANDBOX
// ============================================

interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTime: number;
}

export const executeCodeInSandbox = action({
  args: {
    code: v.string(),
    language: v.union(
      v.literal("python"),
      v.literal("javascript"),
      v.literal("typescript"),
      v.literal("bash")
    ),
    timeout: v.optional(v.number()),
    memoryLimit: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
    executionTime: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    
    try {
      // Create sandbox
      const createResponse = await fetch(`${OPEN_SANDBOX_URL}/sandboxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "opensandbox/code-interpreter:v1.0.1",
          resources: {
            memory: args.memoryLimit || "512Mi",
            cpu: "500m",
            timeout: args.timeout || 300,
          },
          security: {
            network: "restricted",
            readonlyRootFilesystem: true,
          },
        }),
      });
      
      const { sandboxId } = await createResponse.json();
      
      // Execute code
      const execResponse = await fetch(
        `${OPEN_SANDBOX_URL}/sandboxes/${sandboxId}/exec`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: getExecutionCommand(args.language, args.code),
            timeout: args.timeout || 300,
          }),
        }
      );
      
      const result = await execResponse.json();
      
      // Cleanup
      await fetch(`${OPEN_SANDBOX_URL}/sandboxes/${sandboxId}`, {
        method: "DELETE",
      });
      
      return {
        success: true,
        result: {
          stdout: result.stdout,
          stderr: result.stderr,
          exitCode: result.exitCode,
        },
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error("Sandbox execution error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Execution failed",
        executionTime: Date.now() - startTime,
      };
    }
  },
});

function getExecutionCommand(language: string, code: string): string {
  const commands: Record<string, string> = {
    python: `python3 -c "${escapeShellArg(code)}"`,
    javascript: `node -e "${escapeShellArg(code)}"`,
    typescript: `ts-node -e "${escapeShellArg(code)}"`,
    bash: `bash -c "${escapeShellArg(code)}"`,
  };
  return commands[language] || commands.python;
}

function escapeShellArg(arg: string): string {
  return arg.replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

// ============================================
// BROWSER AUTOMATION SANDBOX
// ============================================

export const scrapeUrlInSandbox = action({
  args: {
    url: v.string(),
    selector: v.optional(v.string()),
    waitFor: v.optional(v.number()),
  },
  returns: v.object({
    success: v.boolean(),
    content: v.optional(v.string()),
    title: v.optional(v.string()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Create browser sandbox
      const createResponse = await fetch(`${OPEN_SANDBOX_URL}/sandboxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "opensandbox/playwright:v1.0.0",
          resources: {
            memory: "1Gi",
            cpu: "1000m",
            timeout: 300,
          },
        }),
      });
      
      const { sandboxId } = await createResponse.json();
      
      // Run Playwright script
      const script = `
        const { chromium } = require('playwright');
        (async () => {
          const browser = await chromium.launch();
          const page = await browser.newPage();
          await page.goto('${args.url}', { waitUntil: 'networkidle' });
          ${args.waitFor ? `await page.waitForTimeout(${args.waitFor});` : ''}
          const title = await page.title();
          const content = await page.content();
          console.log(JSON.stringify({ title, content }));
          await browser.close();
        })();
      `;
      
      const execResponse = await fetch(
        `${OPEN_SANDBOX_URL}/sandboxes/${sandboxId}/exec`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: `node -e "${escapeShellArg(script)}"`,
          }),
        }
      );
      
      const result = await execResponse.json();
      
      // Cleanup
      await fetch(`${OPEN_SANDBOX_URL}/sandboxes/${sandboxId}`, {
        method: "DELETE",
      });
      
      // Parse result
      const output = JSON.parse(result.stdout);
      
      return {
        success: true,
        content: output.content,
        title: output.title,
      };
    } catch (error) {
      console.error("Browser sandbox error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Scraping failed",
      };
    }
  },
});

// ============================================
// DOCUMENT PROCESSING SANDBOX
// ============================================

export const processDocumentInSandbox = action({
  args: {
    fileUrl: v.string(),
    operation: v.union(
      v.literal("pdf-to-text"),
      v.literal("docx-to-html"),
      v.literal("pptx-to-images"),
      v.literal("validate-epub")
    ),
  },
  returns: v.object({
    success: v.boolean(),
    resultUrl: v.optional(v.string()),
    metadata: v.optional(v.any()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    try {
      // Create document processing sandbox
      const createResponse = await fetch(`${OPEN_SANDBOX_URL}/sandboxes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: "shothik/document-processor:latest",
          resources: {
            memory: "1Gi",
            cpu: "1000m",
            timeout: 600,
          },
        }),
      });
      
      const { sandboxId } = await createResponse.json();
      
      // Download and process file
      const commands: Record<string, string> = {
        "pdf-to-text": `curl -o input.pdf "${args.fileUrl}" && pdftotext input.pdf output.txt`,
        "docx-to-html": `curl -o input.docx "${args.fileUrl}" && pandoc input.docx -o output.html`,
        "pptx-to-images": `curl -o input.pptx "${args.fileUrl}" && libreoffice --headless --convert-to pdf input.pptx && pdftoppm input.pdf output -png`,
        "validate-epub": `curl -o input.epub "${args.fileUrl}" && epubcheck input.epub`,
      };
      
      const execResponse = await fetch(
        `${OPEN_SANDBOX_URL}/sandboxes/${sandboxId}/exec`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            command: commands[args.operation],
          }),
        }
      );
      
      const result = await execResponse.json();
      
      // Upload result to storage
      // TODO: Implement result upload
      
      // Cleanup
      await fetch(`${OPEN_SANDBOX_URL}/sandboxes/${sandboxId}`, {
        method: "DELETE",
      });
      
      return {
        success: result.exitCode === 0,
        resultUrl: "", // TODO: Return actual URL
        metadata: {
          operation: args.operation,
          exitCode: result.exitCode,
        },
      };
    } catch (error) {
      console.error("Document processing error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Processing failed",
      };
    }
  },
});

// ============================================
// SANDBOX HEALTH CHECK
// ============================================

export const checkSandboxHealth = action({
  args: {},
  returns: v.object({
    healthy: v.boolean(),
    activeSandboxes: v.number(),
    queueLength: v.number(),
    averageWaitTime: v.number(),
  }),
  handler: async (ctx) => {
    try {
      const response = await fetch(`${OPEN_SANDBOX_URL}/health`);
      const data = await response.json();
      
      return {
        healthy: data.status === "ok",
        activeSandboxes: data.activeSandboxes || 0,
        queueLength: data.queueLength || 0,
        averageWaitTime: data.averageWaitTime || 0,
      };
    } catch (error) {
      return {
        healthy: false,
        activeSandboxes: 0,
        queueLength: 0,
        averageWaitTime: 0,
      };
    }
  },
});
