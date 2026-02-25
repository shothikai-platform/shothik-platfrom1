/**
 * Spreadsheet Generator
 * 
 * Generates FortuneSheet-compatible data using LLM
 */

import { LLMGateway } from './llm.js';
import {
  CreateSheetRequest,
  FortuneSheetData,
  SheetConfig,
  CellData,
  GeneratedSheetData,
  ChartConfig
} from '../types/index.js';

export class SpreadsheetGenerator {
  private llm: LLMGateway;

  constructor() {
    this.llm = new LLMGateway();
  }

  /**
   * Generate spreadsheet data from natural language prompt
   */
  async generate(request: CreateSheetRequest): Promise<FortuneSheetData> {
    const { prompt, rows, columns, includeCharts, includeFormulas, dataTypes } = request;

    // Step 1: Generate data structure using LLM
    const generatedData = await this.generateDataWithLLM(prompt, rows, columns, dataTypes);

    // Step 2: Convert to FortuneSheet format
    const sheetConfig = this.convertToFortuneSheet(generatedData, rows, columns);

    // Step 3: Add formulas if requested
    if (includeFormulas && generatedData.formulas) {
      this.addFormulas(sheetConfig, generatedData.formulas);
    }

    // Step 4: Generate charts if requested
    let charts: ChartConfig[] | undefined;
    if (includeCharts) {
      charts = await this.generateCharts(generatedData);
    }

    return {
      title: request.title || generatedData.headers.join(' - '),
      name: 'Sheet1',
      lang: 'en',
      data: [sheetConfig],
      permissions: {
        edit: true,
        comment: true,
        download: true
      }
    };
  }

  /**
   * Generate data structure using LLM
   */
  private async generateDataWithLLM(
    prompt: string,
    rows: number,
    columns: number,
    dataTypes: string[]
  ): Promise<GeneratedSheetData> {
    const systemPrompt = `You are a spreadsheet data generator. Create realistic, structured data based on the user's request.

Rules:
1. Generate ${rows} rows of data with ${columns} columns
2. Include a header row with descriptive column names
3. Data types to include: ${dataTypes.join(', ')}
4. Make data realistic and contextually appropriate
5. Include some numeric columns for calculations
6. Return ONLY valid JSON

Output format:
{
  "headers": ["Column1", "Column2", ...],
  "rows": [
    {"Column1": "value1", "Column2": "value2", ...},
    ...
  ],
  "formulas": [
    {"row": 10, "col": 2, "formula": "=SUM(C2:C9)"}
  ],
  "summary": "Brief description of the data"
}`;

    const userPrompt = `Generate spreadsheet data for: ${prompt}

Requirements:
- ${rows} rows (including header)
- ${columns} columns
- Mix of data types: ${dataTypes.join(', ')}
- Include at least one numeric column for formulas`;

    const response = await this.llm.complete({
      prompt: `${systemPrompt}\n\n${userPrompt}`,
      temperature: 0.3,
      maxTokens: 4000
    });

    try {
      // Extract JSON from response
      const jsonMatch = response.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }

      const data: GeneratedSheetData = JSON.parse(jsonMatch[0]);
      
      // Validate data
      if (!data.headers || !data.rows) {
        throw new Error('Invalid data structure from LLM');
      }

      return data;
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      // Return fallback data
      return this.generateFallbackData(prompt, rows, columns);
    }
  }

  /**
   * Convert generated data to FortuneSheet format
   */
  private convertToFortuneSheet(
    data: GeneratedSheetData,
    rows: number,
    columns: number
  ): SheetConfig {
    const celldata: Array<{ r: number; c: number; v: CellData }> = [];

    // Add headers (row 0)
    data.headers.forEach((header, colIndex) => {
      celldata.push({
        r: 0,
        c: colIndex,
        v: {
          v: header,
          m: header,
          ct: { fa: 'General', t: 'string' },
          bg: '#f0f0f0',
          bl: 1, // bold
          ht: 0 // center align
        }
      });
    });

    // Add data rows
    data.rows.forEach((row, rowIndex) => {
      data.headers.forEach((header, colIndex) => {
        const value = row[header];
        const cellData: CellData = this.createCellData(value);
        
        celldata.push({
          r: rowIndex + 1, // +1 because row 0 is header
          c: colIndex,
          v: cellData
        });
      });
    });

    return {
      name: 'Sheet1',
      status: 1,
      order: 0,
      celldata,
      row: Math.max(rows, data.rows.length + 1),
      column: Math.max(columns, data.headers.length),
      defaultRowHeight: 23,
      defaultColWidth: 100
    };
  }

  /**
   * Create cell data based on value type
   */
  private createCellData(value: any): CellData {
    if (value === null || value === undefined) {
      return { v: '', m: '' };
    }

    if (typeof value === 'number') {
      return {
        v: value,
        m: value.toString(),
        ct: { fa: '0.00', t: 'number' }
      };
    }

    if (typeof value === 'boolean') {
      return {
        v: value,
        m: value ? 'TRUE' : 'FALSE',
        ct: { fa: 'General', t: 'string' }
      };
    }

    if (value instanceof Date) {
      return {
        v: value,
        m: value.toISOString().split('T')[0],
        ct: { fa: 'yyyy-mm-dd', t: 'date' }
      };
    }

    // String (default)
    const strValue = String(value);
    return {
      v: strValue,
      m: strValue,
      ct: { fa: 'General', t: 'string' }
    };
  }

  /**
   * Add formulas to sheet
   */
  private addFormulas(
    sheetConfig: SheetConfig,
    formulas: Array<{ row: number; col: number; formula: string }>
  ): void {
    formulas.forEach(({ row, col, formula }) => {
      sheetConfig.celldata.push({
        r: row,
        c: col,
        v: {
          v: formula,
          m: formula,
          f: formula,
          ct: { fa: 'General', t: 'formula' }
        }
      });
    });
  }

  /**
   * Generate chart configurations
   */
  private async generateCharts(data: GeneratedSheetData): Promise<ChartConfig[]> {
    const charts: ChartConfig[] = [];

    // Find numeric columns for charts
    const numericColumns = data.headers.filter((header, index) => {
      const firstValue = data.rows[0]?.[header];
      return typeof firstValue === 'number';
    });

    if (numericColumns.length >= 1 && data.rows.length > 5) {
      // Add a bar chart for the first numeric column
      charts.push({
        type: 'bar',
        title: `${numericColumns[0]} Overview`,
        dataRange: {
          startRow: 0,
          startCol: 0,
          endRow: Math.min(10, data.rows.length),
          endCol: data.headers.indexOf(numericColumns[0])
        },
        xAxisTitle: data.headers[0],
        yAxisTitle: numericColumns[0]
      });

      // Add a line chart if we have 2+ numeric columns
      if (numericColumns.length >= 2) {
        charts.push({
          type: 'line',
          title: `${numericColumns[0]} vs ${numericColumns[1]}`,
          dataRange: {
            startRow: 0,
            startCol: 0,
            endRow: Math.min(10, data.rows.length),
            endCol: data.headers.indexOf(numericColumns[1])
          }
        });
      }
    }

    return charts;
  }

  /**
   * Generate fallback data when LLM fails
   */
  private generateFallbackData(
    prompt: string,
    rows: number,
    columns: number
  ): GeneratedSheetData {
    const headers = ['ID', 'Name', 'Value', 'Date', 'Status'].slice(0, columns);
    
    const dataRows = [];
    for (let i = 1; i < rows; i++) {
      const row: Record<string, any> = {
        ID: i,
        Name: `Item ${i}`,
        Value: Math.floor(Math.random() * 1000),
        Date: new Date().toISOString().split('T')[0],
        Status: Math.random() > 0.5 ? 'Active' : 'Inactive'
      };
      dataRows.push(row);
    }

    return {
      headers,
      rows: dataRows,
      formulas: [
        { row: rows, col: 2, formula: `=SUM(C2:C${rows})` }
      ],
      summary: `Generated data for: ${prompt}`
    };
  }
}

export const spreadsheetGenerator = new SpreadsheetGenerator();
