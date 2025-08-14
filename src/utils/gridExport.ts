import type {
  GridApiRef,
  GridCsvExportOptions,
  GridJsonExportOptions,
} from '../types/api';

export class GridExportUtils {
  static exportToCsv(
    apiRef: GridApiRef,
    options: GridCsvExportOptions = {}
  ): void {
    const csvContent = this.getDataAsCsv(apiRef, options);
    this.downloadFile(
      csvContent,
      options.fileName || 'grid-export.csv',
      'text/csv'
    );
  }

  static exportToJson(
    apiRef: GridApiRef,
    options: GridJsonExportOptions = {}
  ): void {
    const jsonContent = this.getDataAsJson(apiRef, options);
    this.downloadFile(
      jsonContent,
      options.fileName || 'grid-export.json',
      'application/json'
    );
  }

  static getDataAsCsv(
    apiRef: GridApiRef,
    options: GridCsvExportOptions = {}
  ): string {
    const {
      delimiter = ',',
      includeHeaders = true,
      fields,
      allColumns = false,
      visibleColumns = true,
    } = options;

    const columns = this.getExportColumns(apiRef, {
      fields,
      allColumns,
      visibleColumns,
    });
    const rows = Array.from(apiRef.getRowModels().values());

    let csvContent = '';

    // Add headers
    if (includeHeaders) {
      const headers = columns.map((col) =>
        this.escapeCsvValue(col.headerName, delimiter)
      );
      csvContent += headers.join(delimiter) + '\n';
    }

    // Add data rows
    rows.forEach((row) => {
      const values = columns.map((col) => {
        const value = apiRef.getCellValue(row.id, col.field);
        return this.escapeCsvValue(this.formatCellValue(value), delimiter);
      });
      csvContent += values.join(delimiter) + '\n';
    });

    return csvContent;
  }

  static getDataAsJson(
    apiRef: GridApiRef,
    options: GridJsonExportOptions = {}
  ): string {
    const { fields, allColumns = false, visibleColumns = true } = options;

    const columns = this.getExportColumns(apiRef, {
      fields,
      allColumns,
      visibleColumns,
    });
    const rows = Array.from(apiRef.getRowModels().values());

    const exportData = rows.map((row) => {
      const exportRow: Record<string, any> = {};
      columns.forEach((col) => {
        exportRow[col.field] = apiRef.getCellValue(row.id, col.field);
      });
      return exportRow;
    });

    return JSON.stringify(exportData, null, 2);
  }

  private static getExportColumns(
    apiRef: GridApiRef,
    options: {
      fields?: string[];
      allColumns?: boolean;
      visibleColumns?: boolean;
    }
  ) {
    const { fields, allColumns, visibleColumns } = options;

    if (fields) {
      // Type predicate ensures TypeScript knows `col` is never null
      return fields
        .map((field) => apiRef.getColumn(field))
        .filter((col): col is NonNullable<typeof col> => col !== null);
    }

    if (allColumns) {
      return apiRef.getAllColumns();
    }

    if (visibleColumns) {
      return apiRef.getVisibleColumns();
    }

    return apiRef.getVisibleColumns();
  }

  private static escapeCsvValue(value: string, delimiter: string): string {
    if (value == null) return '';
    const stringValue = value.toString();

    // If the value contains the delimiter, newlines, or quotes, wrap it in quotes
    if (
      stringValue.includes(delimiter) ||
      stringValue.includes('\n') ||
      stringValue.includes('"')
    ) {
      // Escape existing quotes by doubling them
      const escapedValue = stringValue.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }

    return stringValue;
  }

  private static formatCellValue(value: any): string {
    if (value == null) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return value.toString();
  }

  private static downloadFile(
    content: string,
    fileName: string,
    mimeType: string
  ): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }
}
