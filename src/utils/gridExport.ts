import type { GridApiRef } from '../types/api';

export interface ExportOptions {
  fileName?: string;
  includeHeaders?: boolean;
  visibleColumnsOnly?: boolean;
  selectedRowsOnly?: boolean;
  delimiter?: string;
}

export class GridExportUtils {
  static getDataAsCsv(api: GridApiRef, options: ExportOptions = {}): string {
    const {
      includeHeaders = true,
      visibleColumnsOnly = true,
      delimiter = ',',
    } = options;

    const columns = visibleColumnsOnly
      ? api.getVisibleColumns()
      : api.getAllColumns();

    const selectedRowIds = api.getSelectedRowIds();
    const allRowIds = Array.from(api.getRowModels().keys());
    const hasSelection = selectedRowIds.length > 0;
    const allSelected = selectedRowIds.length === allRowIds.length;

    console.log('[v0] Export Debug - Selected IDs:', selectedRowIds);
    console.log('[v0] Export Debug - All IDs:', allRowIds);
    console.log('[v0] Export Debug - Has selection:', hasSelection);
    console.log('[v0] Export Debug - All selected:', allSelected);

    // Export selected rows only if some rows are selected but not all
    const shouldExportSelectedOnly = hasSelection && !allSelected;

    let rows;
    if (shouldExportSelectedOnly) {
      const allRows = Array.from(api.getRowModels().values());
      const selectedIdStrings = selectedRowIds.map((id) => String(id));
      rows = allRows.filter((row) =>
        selectedIdStrings.includes(String(row.id))
      );
      console.log(
        '[v0] Export Debug - Selected ID strings:',
        selectedIdStrings
      );
      console.log(
        '[v0] Export Debug - Sample row IDs:',
        allRows.slice(0, 3).map((r) => ({ id: r.id, type: typeof r.id }))
      );
      console.log('[v0] Export Debug - Filtered selected rows:', rows.length);
    } else {
      rows = Array.from(api.getRowModels().values());
      console.log('[v0] Export Debug - Using all rows:', rows.length);
    }

    const csvRows: string[] = [];

    // Add headers
    if (includeHeaders) {
      const headers = columns.map((col) => `"${col.headerName}"`);
      csvRows.push(headers.join(delimiter));
    }

    // Add data rows
    rows.forEach((row) => {
      const csvRow = columns.map((col) => {
        const value = api.getCellValue(row.id, col.field);
        // Escape quotes and wrap in quotes if contains delimiter, quotes, or newlines
        const stringValue = String(value ?? '');
        if (
          stringValue.includes(delimiter) ||
          stringValue.includes('"') ||
          stringValue.includes('\n')
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      csvRows.push(csvRow.join(delimiter));
    });

    return csvRows.join('\n');
  }

  static exportToCsv(api: GridApiRef, options: ExportOptions = {}): void {
    const { fileName = 'export.csv' } = options;
    const csvContent = this.getDataAsCsv(api, options);

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  static getDataAsJson(api: GridApiRef, options: ExportOptions = {}): string {
    const { visibleColumnsOnly = true } = options;

    const columns = visibleColumnsOnly
      ? api.getVisibleColumns()
      : api.getAllColumns();

    const selectedRowIds = api.getSelectedRowIds();
    const allRowIds = Array.from(api.getRowModels().keys());
    const hasSelection = selectedRowIds.length > 0;
    const allSelected = selectedRowIds.length === allRowIds.length;

    // Export selected rows only if some rows are selected but not all
    const shouldExportSelectedOnly = hasSelection && !allSelected;

    let rows;
    if (shouldExportSelectedOnly) {
      const allRows = Array.from(api.getRowModels().values());
      const selectedIdStrings = selectedRowIds.map((id) => String(id));
      rows = allRows.filter((row) =>
        selectedIdStrings.includes(String(row.id))
      );
    } else {
      rows = Array.from(api.getRowModels().values());
    }

    const jsonData = rows.map((row) => {
      const rowData: Record<string, any> = {};
      columns.forEach((col) => {
        rowData[col.field] = api.getCellValue(row.id, col.field);
      });
      return rowData;
    });

    return JSON.stringify(jsonData, null, 2);
  }

  static exportToJson(api: GridApiRef, options: ExportOptions = {}): void {
    const { fileName = 'export.json' } = options;
    const jsonContent = this.getDataAsJson(api, options);

    const blob = new Blob([jsonContent], {
      type: 'application/json;charset=utf-8;',
    });
    const link = document.createElement('a');

    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  static getDataAsExcel(api: GridApiRef, options: ExportOptions = {}): Blob {
    // For now, return CSV format as Excel can open CSV files
    // In a real implementation, you might use a library like xlsx
    const csvContent = this.getDataAsCsv(api, options);
    return new Blob([csvContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
  }

  static exportToExcel(api: GridApiRef, options: ExportOptions = {}): void {
    const { fileName = 'export.xlsx' } = options;
    const blob = this.getDataAsExcel(api, options);

    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }
}
