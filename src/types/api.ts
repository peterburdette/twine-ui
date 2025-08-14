import type React from 'react';
import type { Column, ColumnVisibility } from './index';

export interface GridRowModel {
  [key: string]: any;
}

export interface GridColDef extends Column {
  field: string;
  headerName: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  flex?: number;
  sortable?: boolean;
  filterable?: boolean;
  hideable?: boolean;
  resizable?: boolean;
  editable?: boolean;
  align?: 'left' | 'center' | 'right';
  headerAlign?: 'left' | 'center' | 'right';
  type?: 'string' | 'number' | 'date' | 'boolean' | 'actions';
  valueGetter?: (params: GridValueGetterParams) => any;
  valueFormatter?: (params: GridValueFormatterParams) => string;
  valueSetter?: (params: GridValueSetterParams) => GridRowModel;
  renderCell?: (params: GridRenderCellParams) => React.ReactNode;
  renderHeader?: (params: GridRenderHeaderParams) => React.ReactNode;
  renderEditCell?: (params: GridRenderEditCellParams) => React.ReactNode;
}

export interface GridValueGetterParams {
  id: string | number;
  field: string;
  value: any;
  row: GridRowModel;
  colDef: GridColDef;
  api: GridApiRef;
}

export interface GridValueFormatterParams {
  id: string | number;
  field: string;
  value: any;
  api: GridApiRef;
}

export interface GridValueSetterParams {
  value: any;
  row: GridRowModel;
  field: string;
  api: GridApiRef;
}

export interface GridRenderCellParams {
  id: string | number;
  field: string;
  value: any;
  formattedValue?: string;
  row: GridRowModel;
  colDef: GridColDef;
  cellMode: 'view' | 'edit';
  hasFocus: boolean;
  tabIndex: number;
  api: GridApiRef;
}

export interface GridRenderHeaderParams {
  field: string;
  colDef: GridColDef;
  api: GridApiRef;
}

export interface GridRenderEditCellParams extends GridRenderCellParams {
  cellMode: 'edit';
}

export interface GridSelectionModel {
  [id: string]: boolean;
}

export interface GridSortItem {
  field: string;
  sort: 'asc' | 'desc' | null;
}

export interface GridFilterItem {
  id?: string;
  field: string;
  operator: string;
  value: any;
}

export interface GridFilterModel {
  items: GridFilterItem[];
  linkOperator?: 'and' | 'or';
  quickFilterValues?: string[];
  quickFilterLogicOperator?: 'and' | 'or';
}

export interface GridPaginationModel {
  page: number;
  pageSize: number;
}

export interface GridRowParams {
  id: string | number;
  row: GridRowModel;
  columns: GridColDef[];
}

export interface GridCellParams {
  id: string | number;
  field: string;
  value: any;
  row: GridRowModel;
  colDef: GridColDef;
}

// API Methods Interface
export interface GridApiRef {
  // Row methods
  getRow: (id: string | number) => GridRowModel | null;
  getRowModels: () => Map<string | number, GridRowModel>;
  getRowsCount: () => number;
  getSelectedRows: () => Map<string | number, GridRowModel>;
  setRows: (rows: GridRowModel[]) => void;
  updateRows: (updates: GridRowModel[]) => void;

  // Selection methods
  selectRow: (
    id: string | number,
    isSelected?: boolean,
    resetSelection?: boolean
  ) => void;
  selectRows: (
    ids: (string | number)[],
    isSelected?: boolean,
    resetSelection?: boolean
  ) => void;
  selectRowRange: (
    range: { startId: string | number; endId: string | number },
    isSelected?: boolean,
    resetSelection?: boolean
  ) => void;
  deselectRow: (id: string | number) => void;
  deselectRows: (ids: (string | number)[]) => void;
  selectAll: () => void;
  deselectAll: () => void;
  isRowSelected: (id: string | number) => boolean;
  getSelectedRowIds: () => (string | number)[];
  setSelectionModel: (model: (string | number)[]) => void;

  // Column methods
  getColumn: (field: string) => GridColDef | null;
  getAllColumns: () => GridColDef[];
  getVisibleColumns: () => GridColDef[];
  getColumnIndex: (field: string, useVisibleColumns?: boolean) => number;
  getColumnPosition: (field: string) => number;
  setColumnVisibility: (field: string, isVisible: boolean) => void;
  setColumnsVisibility: (model: ColumnVisibility) => void;
  getColumnVisibilityModel: () => ColumnVisibility;
  setColumnWidth: (field: string, width: number) => void;
  setColumnOrder: (fields: string[]) => void;
  getColumnOrder: () => string[];

  // Sorting methods
  getSortModel: () => GridSortItem[];
  setSortModel: (model: GridSortItem[]) => void;
  sortColumn: (
    field: string,
    direction?: 'asc' | 'desc' | null,
    allowMultiple?: boolean
  ) => void;

  // Filtering methods
  getFilterModel: () => GridFilterModel;
  setFilterModel: (model: GridFilterModel) => void;
  setQuickFilterValues: (values: string[]) => void;
  showFilterPanel: (targetColumnField?: string) => void;
  hideFilterPanel: () => void;

  // Pagination methods
  getPaginationModel: () => GridPaginationModel;
  setPaginationModel: (model: GridPaginationModel) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;

  // Export methods
  getDataAsCsv: (options?: GridCsvExportOptions) => string;
  exportDataAsCsv: (options?: GridCsvExportOptions) => void;
  getDataAsJson: (options?: GridJsonExportOptions) => string;
  exportDataAsJson: (options?: GridJsonExportOptions) => void;

  // Scroll methods
  scrollToIndexes: (params: {
    rowIndex?: number;
    colIndex?: number;
  }) => boolean;
  getScrollPosition: () => { top: number; left: number };
  scroll: (params: { top?: number; left?: number }) => void;

  // State methods
  getState: () => GridState;
  setState: (stateUpdater: (oldState: GridState) => GridState) => void;
  forceUpdate: () => void;

  // Utility methods
  getCellValue: (id: string | number, field: string) => any;
  setCellValue: (id: string | number, field: string, value: any) => void;
  getRowNode: (id: string | number) => GridRowNode | null;

  // Event methods
  subscribeEvent: <T extends keyof GridEventMap>(
    event: T,
    handler: GridEventMap[T]
  ) => () => void;
  publishEvent: <T extends keyof GridEventMap>(
    event: T,
    params: Parameters<GridEventMap[T]>[0]
  ) => void;
}

export interface GridRowNode {
  id: string | number;
  parent?: string | number | null;
  depth: number;
  groupingKey?: string | null;
  groupingField?: string | null;
}

export interface GridState {
  rows: {
    dataRowIds: (string | number)[];
    dataRowIdToModelLookup: Record<string | number, GridRowModel>;
    totalRowCount: number;
  };
  columns: {
    all: string[];
    visible: string[];
    columnVisibilityModel: ColumnVisibility;
    dimensions: Record<
      string,
      { width: number; minWidth: number; maxWidth: number }
    >;
    orderedFields: string[];
  };
  sorting: {
    sortModel: GridSortItem[];
  };
  filter: {
    filterModel: GridFilterModel;
    visibleRowsLookup: Record<string | number, boolean>;
    filteredRowsLookup: Record<string | number, boolean>;
  };
  pagination: {
    paginationModel: GridPaginationModel;
    rowCount: number;
    pageCount: number;
  };
  selection: (string | number)[];
  focus: {
    cell: { id: string | number; field: string } | null;
    columnHeader: { field: string } | null;
  };
  tabIndex: {
    cell: { id: string | number; field: string } | null;
    columnHeader: { field: string } | null;
  };
}

// Export options
export interface GridCsvExportOptions {
  fileName?: string;
  delimiter?: string;
  includeHeaders?: boolean;
  includeColumnGroupsHeaders?: boolean;
  fields?: string[];
  allColumns?: boolean;
  visibleColumns?: boolean;
}

export interface GridJsonExportOptions {
  fileName?: string;
  fields?: string[];
  allColumns?: boolean;
  visibleColumns?: boolean;
}

// Event system
export interface GridEventMap {
  rowClick: (params: GridRowParams) => void;
  rowDoubleClick: (params: GridRowParams) => void;
  cellClick: (params: GridCellParams) => void;
  cellDoubleClick: (params: GridCellParams) => void;
  columnHeaderClick: (params: { field: string; colDef: GridColDef }) => void;
  sortModelChange: (model: GridSortItem[]) => void;
  filterModelChange: (model: GridFilterModel) => void;
  selectionModelChange: (selectionModel: (string | number)[]) => void;
  paginationModelChange: (model: GridPaginationModel) => void;
  columnVisibilityModelChange: (model: ColumnVisibility) => void;
  columnOrderChange: (params: { fields: string[] }) => void;
  columnWidthChange: (params: { field: string; width: number }) => void;
  rowSelectionChange: (params: {
    id: string | number;
    isSelected: boolean;
  }) => void;
  stateChange: (state: GridState) => void;
}

// Hook for creating API ref
export interface UseGridApiRefReturn {
  current: GridApiRef;
}
