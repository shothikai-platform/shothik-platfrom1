/**
 * Sheet Service Types
 * 
 * Type definitions for AI-powered spreadsheet generation
 */

import { z } from 'zod';

// ============================================================================
// Enums
// ============================================================================

export const SheetStatus = z.enum([
  'pending',
  'generating_data',
  'generating_formulas',
  'generating_charts',
  'completed',
  'failed'
]);

export type SheetStatus = z.infer<typeof SheetStatus>;

export const ExportFormat = z.enum(['json', 'xlsx', 'csv']);
export type ExportFormat = z.infer<typeof ExportFormat>;

// ============================================================================
// Cell Types
// ============================================================================

export const CellType = z.enum([
  'string',
  'number',
  'boolean',
  'date',
  'formula',
  'hyperlink'
]);

export type CellType = z.infer<typeof CellType>;

export const CellData = z.object({
  v: z.union([z.string(), z.number(), z.boolean(), z.date()]).optional(), // value
  m: z.string().optional(), // formatted value
  f: z.string().optional(), // formula
  ct: z.object({ // cell type
    fa: z.string(), // format string
    t: CellType
  }).optional(),
  bg: z.string().optional(), // background color
  fc: z.string().optional(), // font color
  ff: z.string().optional(), // font family
  fs: z.number().optional(), // font size
  bl: z.number().optional(), // bold
  it: z.number().optional(), // italic
  un: z.number().optional(), // underline
  vt: z.number().optional(), // vertical align
  ht: z.number().optional(), // horizontal align
  mc: z.object({ // merge cell
    r: z.number(),
    c: z.number(),
    rs: z.number(),
    cs: z.number()
  }).optional()
});

export type CellData = z.infer<typeof CellData>;

// ============================================================================
// FortuneSheet Format
// ============================================================================

export const SheetConfig = z.object({
  name: z.string(),
  color: z.string().optional(),
  status: z.number().default(1),
  order: z.number().default(0),
  celldata: z.array(z.object({
    r: z.number(), // row
    c: z.number(), // column
    v: CellData
  })),
  config: z.object({
    merge: z.record(z.any()).optional(),
    rowlen: z.record(z.number()).optional(),
    columnlen: z.record(z.number()).optional(),
    rowhidden: z.record(z.any()).optional(),
    colhidden: z.record(z.any()).optional(),
    borderInfo: z.array(z.any()).optional()
  }).optional(),
  row: z.number().default(100),
  column: z.number().default(20),
  defaultRowHeight: z.number().default(23),
  defaultColWidth: z.number().default(73)
});

export type SheetConfig = z.infer<typeof SheetConfig>;

export const FortuneSheetData = z.object({
  title: z.string(),
  name: z.string(),
  lang: z.string().default('en'),
  data: z.array(SheetConfig),
  permissions: z.object({
    edit: z.boolean().default(true),
    comment: z.boolean().default(true),
    download: z.boolean().default(true)
  }).optional()
});

export type FortuneSheetData = z.infer<typeof FortuneSheetData>;

// ============================================================================
// Chart Types
// ============================================================================

export const ChartType = z.enum([
  'line',
  'bar',
  'column',
  'pie',
  'area',
  'scatter',
  'doughnut'
]);

export type ChartType = z.infer<typeof ChartType>;

export const ChartConfig = z.object({
  type: ChartType,
  title: z.string(),
  dataRange: z.object({
    startRow: z.number(),
    startCol: z.number(),
    endRow: z.number(),
    endCol: z.number()
  }),
  xAxisTitle: z.string().optional(),
  yAxisTitle: z.string().optional(),
  seriesNames: z.array(z.string()).optional()
});

export type ChartConfig = z.infer<typeof ChartConfig>;

// ============================================================================
// Request/Response Types
// ============================================================================

export const CreateSheetRequest = z.object({
  userId: z.string(),
  prompt: z.string().min(1).max(5000),
  title: z.string().optional(),
  rows: z.number().min(10).max(10000).default(100),
  columns: z.number().min(5).max(100).default(20),
  includeCharts: z.boolean().default(false),
  includeFormulas: z.boolean().default(true),
  dataTypes: z.array(z.enum(['text', 'numbers', 'dates', 'currency', 'percentages'])).default(['text', 'numbers'])
});

export type CreateSheetRequest = z.infer<typeof CreateSheetRequest>;

export const SheetJob = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  prompt: z.string(),
  title: z.string(),
  status: SheetStatus,
  progress: z.number().min(0).max(100).default(0),
  data: z.optional(FortuneSheetData),
  charts: z.array(ChartConfig).optional(),
  error: z.string().optional(),
  exportUrls: z.record(ExportFormat, z.string().url()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional()
});

export type SheetJob = z.infer<typeof SheetJob>;

export const SheetResponse = z.object({
  success: z.boolean(),
  jobId: z.string().uuid().optional(),
  data: z.union([SheetJob, FortuneSheetData]).optional(),
  error: z.string().optional()
});

export type SheetResponse = z.infer<typeof SheetResponse>;

// ============================================================================
// Queue Types
// ============================================================================

export const SheetJobData = z.object({
  jobId: z.string().uuid(),
  userId: z.string(),
  prompt: z.string(),
  title: z.string(),
  rows: z.number(),
  columns: z.number(),
  includeCharts: z.boolean(),
  includeFormulas: z.boolean(),
  dataTypes: z.array(z.string())
});

export type SheetJobData = z.infer<typeof SheetJobData>;

// ============================================================================
// LLM Types
// ============================================================================

export interface LLMService {
  complete(request: {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<{
    text: string;
    tokensUsed: number;
  }>;
  
  stream(request: {
    prompt: string;
    temperature?: number;
    maxTokens?: number;
  }): AsyncIterable<string>;
}

export interface GeneratedSheetData {
  headers: string[];
  rows: Array<Record<string, any>>;
  formulas?: Array<{
    row: number;
    col: number;
    formula: string;
  }>;
  charts?: ChartConfig[];
  summary?: string;
}
