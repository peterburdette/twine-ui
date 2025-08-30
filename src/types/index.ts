import type React from 'react';
import type { GridRenderCellParams, GridValueGetterParams } from './api';

export interface GridColDef {
  field: string;
  headerName: string;
  width?: number;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  type?: 'string' | 'number' | 'boolean' | 'date' | 'actions';
  editable?: boolean;
  renderCell?: (params: GridRenderCellParams) => React.ReactNode;
  valueGetter?: (params: GridValueGetterParams) => any;
}

export interface Column extends Omit<GridColDef, 'type'> {
  type?: GridColDef['type'];
}

export interface SortModel {
  field: string;
  sort: 'asc' | 'desc';
}

export interface FilterRule {
  id: string;
  field: string;
  operator:
    | 'contains'
    | 'equals'
    | 'startsWith'
    | 'endsWith'
    | 'isEmpty'
    | 'isNotEmpty';
  value: string;
}

export interface ColumnVisibility {
  [key: string]: boolean;
}

export interface DataGridProps {
  rows: any[];
  columns: Column[];
  pageSize?: number;
  pageSizeOptions?: number[];
  checkboxSelection?: boolean;
  disableSelectionOnClick?: boolean;
  loading?: boolean;
  onSelectionModelChange?: (selectedIds: string[]) => void;
  onSortModelChange?: (sortModel: SortModel[]) => void;
  onFilterModelChange?: (filterRules: FilterRule[]) => void;
  className?: string;
  showToolbar?: boolean;
  showFooter?: boolean;
  hideSearch?: boolean;
  hideFilters?: boolean;
  hideExport?: boolean;
  hideColumns?: boolean;
  hideRowsPerPage?: boolean;
  density?: 'compact' | 'standard' | 'comfortable';
  disableColumnFilter?: boolean;
  disableColumnMenu?: boolean;
  hideFilterLabel?: boolean;
  hideExportLabel?: boolean;
  hideColumnsLabel?: boolean;
  hideGridLines?: boolean;
  enableColumnReorder?: boolean;
  enableColumnFilters?: boolean;
  disableColumnResize?: boolean;
  noDataMessage?: string | React.ReactNode;
  apiRef?: React.MutableRefObject<any>;
  isEditable?: boolean;
  onCellValueChange?: (params: {
    id: string | number;
    field: string;
    value: any;
  }) => void;
  checkboxSelectionOnRowClick?: boolean;
  onRowsChange?: (updatedRows: any[]) => void;
  idField?: string;
}

// Re-export API types
export * from './api';
