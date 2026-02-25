/**
 * Export Service
 * 
 * Handles exporting spreadsheets to various formats
 */

import * as XLSX from 'xlsx';
import { FortuneSheetData, ExportFormat } from '../types/index.js';

export class ExportService {
  /**
   * Export FortuneSheet data to Excel format
   */
  async exportToExcel(data: FortuneSheetData): Promise<Buffer> {
    const sheet = data.data[0];
    if (!sheet) {
      throw new Error('No sheet data found');
    }

    // Convert celldata to 2D array
    const maxRow = Math.max(...sheet.celldata.map(c => c.r), 0);
    const maxCol = Math.max(...sheet.celldata.map(c => c.c), 0);

    const worksheetData: any[][] = [];
    for (let r = 0; r <= maxRow; r++) {
      const row: any[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = sheet.celldata.find(cell => cell.r === r && cell.c === c);
        row.push(cell?.v?.v ?? '');
      }
      worksheetData.push(row);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);

    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }

  /**
   * Export FortuneSheet data to CSV format
   */
  async exportToCSV(data: FortuneSheetData): Promise<Buffer> {
    const sheet = data.data[0];
    if (!sheet) {
      throw new Error('No sheet data found');
    }

    // Convert celldata to 2D array
    const maxRow = Math.max(...sheet.celldata.map(c => c.r), 0);
    const maxCol = Math.max(...sheet.celldata.map(c => c.c), 0);

    const rows: string[] = [];
    for (let r = 0; r <= maxRow; r++) {
      const row: string[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = sheet.celldata.find(cell => cell.r === r && cell.c === c);
        const value = cell?.v?.v ?? '';
        // Escape CSV values
        const escaped = String(value).includes(',') 
          ? `"${String(value).replace(/"/g, '""')}"` 
          : String(value);
        row.push(escaped);
      }
      rows.push(row.join(','));
    }

    return Buffer.from(rows.join('\n'), 'utf-8');
  }

  /**
   * Export to requested format
   */
  async export(data: FortuneSheetData, format: ExportFormat): Promise<{ buffer: Buffer; contentType: string; extension: string }> {
    switch (format) {
      case 'xlsx':
        return {
          buffer: await this.exportToExcel(data),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          extension: 'xlsx'
        };
      case 'csv':
        return {
          buffer: await this.exportToCSV(data),
          contentType: 'text/csv',
          extension: 'csv'
        };
      case 'json':
        return {
          buffer: Buffer.from(JSON.stringify(data, null, 2), 'utf-8'),
          contentType: 'application/json',
          extension: 'json'
        };
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }
}

export const exportService = new ExportService();
