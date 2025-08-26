'use client';

import type React from 'react';
import {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { Input } from '../ui/Input/Input';
import { Checkbox } from '../ui/Checkbox/Checkbox';
import { cn } from '../../lib/utils';
import { GridExportUtils } from '../../utils/gridExport';
import type {
  DataGridProps,
  FilterRule,
  ColumnVisibility,
  SortModel,
} from '../../types';
import type {
  GridApiRef,
  GridRowModel,
  GridState,
  GridFilterModel,
  GridSortItem,
  GridEventMap,
} from '../../types/api';
import type { Column, GridColDef } from '../../types';
import DataGridToolbar from './_components/DataGridToolbar';
import DataGridFooter from './_components/DataGridFooter';

// Normalizes Column['type'] to GridColDef['type']
const normalizeGridType = (t: Column['type']): GridColDef['type'] => {
  switch (t) {
    case undefined:
    case 'string':
    case 'number':
    case 'boolean':
    case 'date':
    case 'actions':
      return t as GridColDef['type'];
    default:
      // any custom/unknown string -> treat as 'string'
      return 'string';
  }
};

// Convert your Column to a GridColDef for API returns
const toGridColDef = (col: Column): GridColDef =>
  ({
    ...col,
    type: normalizeGridType(col.type),
  } as GridColDef);

const DataGrid = forwardRef<GridApiRef, DataGridProps>((props, ref) => {
  const {
    rows: initialRows,
    columns,
    pageSize = 10,
    pageSizeOptions = [5, 10, 25, 50, 100],
    checkboxSelection = false,
    onSelectionModelChange,
    onSortModelChange,
    onFilterModelChange,
    className = '',
    hideToolbar = false,
    hideFooter = false,
    hideSearch = false,
    hideFilters = false,
    hideExport = false,
    hideColumns = false,
    hideRowsPerPage = false,
    density = 'standard',
    hideFilterLabel = false,
    hideExportLabel = false,
    hideColumnsLabel = false,
    hideGridLines = false,
    enableColumnReorder = false,
    enableColumnFilters = false,
    disableColumnResize = false,
    noDataMessage = 'No data available',
    apiRef,
    onCellValueChange,
    checkboxSelectionOnRowClick = false,
    onRowsChange,
    idField = 'id',
  } = props;

  const [rows, setRows] = useState(initialRows);

  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  const [page, setPage] = useState(0);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortModel, setSortModel] = useState<SortModel[]>([]);
  const [filterModel, setFilterModel] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>(
    () => {
      const initialWidths: Record<string, number> = {};
      columns.forEach((col) => {
        initialWidths[col.field] = col.width || 150;
      });
      return initialWidths;
    }
  );
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartWidth, setDragStartWidth] = useState(0);
  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  // Popover state
  const [showFilterPopover, setShowFilterPopover] = useState(false);
  const [showColumnPopover, setShowColumnPopover] = useState(false);
  const [showExportPopover, setShowExportPopover] = useState(false);
  const [columnSearchQuery, setColumnSearchQuery] = useState('');

  const [exportPopoverPosition, setExportPopoverPosition] = useState({
    top: 0,
    left: 0,
  });
  const [filterPopoverPosition, setFilterPopoverPosition] = useState({
    top: 0,
    left: 0,
  });
  const [columnPopoverPosition, setColumnPopoverPosition] = useState({
    top: 0,
    left: 0,
  });

  const exportButtonRef = useRef<HTMLButtonElement>(null);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const columnButtonRef = useRef<HTMLButtonElement>(null);

  const tableRef = useRef<HTMLTableElement>(null);
  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((col) => col.field)
  );
  const [filterRules, setFilterRules] = useState<FilterRule[]>([]);
  const [tempFilterRules, setTempFilterRules] = useState<FilterRule[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(
    columns.reduce((acc, col) => ({ ...acc, [col.field]: true }), {})
  );
  const [tempColumnVisibility, setTempColumnVisibility] =
    useState<ColumnVisibility>({});

  // Events
  const eventListeners = useRef<Map<keyof GridEventMap, Set<Function>>>(
    new Map()
  );

  const exportPopoverRef = useRef<HTMLDivElement>(null);
  const filterPopoverRef = useRef<HTMLDivElement>(null);
  const columnPopoverRef = useRef<HTMLDivElement>(null);

  const [editingCell, setEditingCell] = useState<{
    rowId: string | number;
    field: string;
  } | null>(null);
  const [editValue, setEditValue] = useState<any>(null); // preserve type during editing

  // Filtered columns (Manage Columns popover)
  const filteredColumns = useMemo(() => {
    if (!columnSearchQuery) return columns;
    return columns.filter(
      (column) =>
        column.headerName
          .toLowerCase()
          .includes(columnSearchQuery.toLowerCase()) ||
        column.field.toLowerCase().includes(columnSearchQuery.toLowerCase())
    );
  }, [columns, columnSearchQuery]);

  // API
  const api: GridApiRef = useMemo(
    () => ({
      getRow: (id: string | number) =>
        rows.find((row) => row.id === id) || null,
      getRowModels: () => {
        const map = new Map<string | number, GridRowModel>();
        rows.forEach((row) => map.set(row.id, row));
        return map;
      },
      getRowsCount: () => rows.length,
      getSelectedRows: () => {
        const map = new Map<string | number, GridRowModel>();
        selectedRows.forEach((id) => {
          const row = rows.find((r) => r.id === id);
          if (row) map.set(id, row);
        });
        return map;
      },
      setRows: (_newRows: GridRowModel[]) => {
        console.warn('setRows not implemented - use controlled rows prop');
      },
      updateRows: (_updates: GridRowModel[]) => {
        console.warn('updateRows not implemented - use controlled rows prop');
      },

      // Selection methods
      selectRow: (id, isSelected = true, resetSelection = false) => {
        const newSelection = resetSelection
          ? new Set<string>()
          : new Set(selectedRows);
        if (isSelected) newSelection.add(String(id));
        else newSelection.delete(String(id));
        setSelectedRows(Array.from(newSelection));
        onSelectionModelChange?.(Array.from(newSelection));
      },
      selectRows: (ids, isSelected = true, resetSelection = false) => {
        const newSelection = resetSelection
          ? new Set<string>()
          : new Set(selectedRows);
        ids.forEach((id) => {
          if (isSelected) newSelection.add(String(id));
          else newSelection.delete(String(id));
        });
        setSelectedRows(Array.from(newSelection));
        onSelectionModelChange?.(Array.from(newSelection));
      },
      selectRowRange: () => {
        console.warn('selectRowRange not fully implemented');
      },
      deselectRow: (id) => {
        api.selectRow(id, false);
      },
      deselectRows: (ids) => {
        api.selectRows(ids, false);
      },
      selectAll: () => {
        const allIds = rows.map((row) =>
          String((row as any)[idField as any] ?? (row as any).id)
        );
        setSelectedRows(allIds);
        onSelectionModelChange?.(allIds);
      },
      deselectAll: () => {
        setSelectedRows([]);
        onSelectionModelChange?.([]);
      },
      isRowSelected: (id) => selectedRows.includes(String(id)),
      getSelectedRowIds: () => Array.from(selectedRows),
      setSelectionModel: (model) => {
        const newSelection = model.map((id) => String(id));
        setSelectedRows(newSelection);
        onSelectionModelChange?.(model.map((id) => String(id)));
      },

      // Column methods
      getColumn: (field) => {
        const col = columns.find((c) => c.field === field);
        return col ? toGridColDef(col) : null;
      },
      getAllColumns: () => columns.map(toGridColDef),
      getVisibleColumns: () =>
        orderedColumns
          .filter((col) => columnVisibility[col.field] !== false)
          .map(toGridColDef),
      getColumnIndex: (field, useVisibleColumns = false) => {
        const cols = useVisibleColumns ? api.getVisibleColumns() : columns;
        return cols.findIndex((col) => col.field === field);
      },
      getColumnPosition: (field) => columnOrder.indexOf(field),
      setColumnVisibility: (field, isVisible) =>
        setColumnVisibility((prev) => ({ ...prev, [field]: isVisible })),
      setColumnsVisibility: (model) => setColumnVisibility(model),
      getColumnVisibilityModel: () => columnVisibility,
      setColumnWidth: (field, width) =>
        setColumnWidths((prev) => ({ ...prev, [field]: width })),
      setColumnOrder: (fields) => setColumnOrder(fields),
      getColumnOrder: () => columnOrder,

      // Sorting methods
      getSortModel: () =>
        sortModel.map((sort) => ({ field: sort.field, sort: sort.sort })),
      setSortModel: (model: GridSortItem[]) => {
        const newSortModel = model.map((item) => ({
          field: item.field,
          sort: item.sort!,
        }));
        setSortModel(newSortModel);
        onSortModelChange?.(newSortModel);
      },
      sortColumn: (
        field,
        direction: 'asc' | 'desc' | null = 'asc',
        allowMultiple = false
      ) => {
        if (direction === null) {
          const newSortModel = sortModel.filter((sort) => sort.field !== field);
          setSortModel(newSortModel);
          onSortModelChange?.(newSortModel);
          return;
        }
        const newSort = { field, sort: direction };
        const newSortModel = allowMultiple
          ? [...sortModel, newSort]
          : [newSort];
        setSortModel(newSortModel);
        onSortModelChange?.(newSortModel);
      },

      // Filtering methods
      getFilterModel: () => ({
        items: filterRules.map((rule) => ({
          field: rule.field,
          operator: rule.operator,
          value: rule.value,
        })),
      }),
      setFilterModel: (model: GridFilterModel) => {
        const allowedOperators: FilterRule['operator'][] = [
          'contains',
          'equals',
          'startsWith',
          'endsWith',
          'isEmpty',
          'isNotEmpty',
        ];
        const newRules = model.items
          .filter((item) => allowedOperators.includes(item.operator as any))
          .map((item) => ({
            id: Math.random().toString(36).slice(2, 11),
            field: item.field,
            operator: item.operator as FilterRule['operator'],
            value: item.value,
          }));
        setFilterRules(newRules);
        onFilterModelChange?.(newRules);
      },
      setQuickFilterValues: (values: string[]) =>
        setSearchQuery(values.join(' ')),
      showFilterPanel: () => setShowFilterPopover(true),
      hideFilterPanel: () => setShowFilterPopover(false),

      // Pagination methods
      getPaginationModel: () => ({ page, pageSize: currentPageSize }),
      setPaginationModel: (model) => {
        setPage(model.page);
        setCurrentPageSize(model.pageSize);
      },
      setPage: (newPage) => setPage(newPage),
      setPageSize: (newPageSize) => {
        setCurrentPageSize(newPageSize);
        setPage(0);
      },

      // Export methods
      getDataAsCsv: (options = {}) =>
        GridExportUtils.getDataAsCsv(api, options),
      exportDataAsCsv: (options = {}) =>
        GridExportUtils.exportToCsv(api, options),
      getDataAsJson: (options = {}) =>
        GridExportUtils.getDataAsJson(api, options),
      exportDataAsJson: (options = {}) =>
        GridExportUtils.exportToJson(api, options),

      // Scroll methods
      scrollToIndexes: () => {
        console.warn('scrollToIndexes not implemented');
        return false;
      },
      getScrollPosition: () => ({ top: 0, left: 0 }),
      scroll: () => {
        console.warn('scroll not implemented');
      },

      // State methods
      getState: (): GridState => ({
        rows: {
          dataRowIds: rows.map((row) => row.id),
          dataRowIdToModelLookup: rows.reduce(
            (acc, row) => ({ ...acc, [row.id]: row }),
            {}
          ),
          totalRowCount: rows.length,
        },
        columns: {
          all: columns.map((col) => col.field),
          visible: orderedColumns
            .filter((col) => columnVisibility[col.field] !== false)
            .map((col) => col.field),
          columnVisibilityModel: columnVisibility,
          dimensions: columnWidths as any,
          orderedFields: columnOrder,
        },
        sorting: {
          sortModel: sortModel.map((sort) => ({
            field: sort.field,
            sort: sort.sort,
          })),
        },
        filter: {
          filterModel: api.getFilterModel(),
          visibleRowsLookup: {},
          filteredRowsLookup: {},
        },
        pagination: {
          paginationModel: { page, pageSize: currentPageSize },
          rowCount: rows.length,
          pageCount: Math.ceil(rows.length / currentPageSize),
        },
        selection: Array.from(selectedRows),
        focus: { cell: null, columnHeader: null },
        tabIndex: { cell: null, columnHeader: null },
      }),
      setState: () => {
        console.warn('setState not implemented');
      },
      forceUpdate: () => {
        console.warn('forceUpdate not implemented');
      },

      // Utility methods
      getCellValue: (id, field) => {
        const row = rows.find((r) => r.id === id);
        return row ? (row as any)[field] : null;
      },
      setCellValue: () => {
        console.warn('setCellValue not implemented - use controlled rows prop');
      },
      getRowNode: (id) => ({ id, parent: null, depth: 0 }),

      // Events
      subscribeEvent: (event, handler) => {
        if (!eventListeners.current.has(event))
          eventListeners.current.set(event, new Set());
        eventListeners.current.get(event)!.add(handler as any);
        return () => {
          eventListeners.current.get(event)?.delete(handler as any);
        };
      },
      publishEvent: (event, params) => {
        eventListeners.current.get(event)?.forEach((handler) => {
          (handler as any)(params);
        });
      },
    }),
    [
      rows,
      columns,
      selectedRows,
      sortModel,
      filterRules,
      columnVisibility,
      columnOrder,
      columnWidths,
      page,
      currentPageSize,
    ]
  );

  useImperativeHandle(ref, () => api, [api]);
  useEffect(() => {
    if (apiRef) apiRef.current = api;
  }, [apiRef, api]);

  const orderedColumns = useMemo(() => {
    return columnOrder
      .map((fieldName) => columns.find((col) => col.field === fieldName))
      .filter(Boolean) as typeof columns;
  }, [columnOrder, columns]);

  const getDensityClasses = () =>
    density === 'compact'
      ? 'text-xs'
      : density === 'comfortable'
      ? 'text-base'
      : 'text-sm';
  const getCellPadding = () =>
    density === 'compact' ? 'p-1' : density === 'comfortable' ? 'p-3' : 'p-2';
  const getHeaderPadding = () =>
    density === 'compact' ? 'p-2' : density === 'comfortable' ? 'p-4' : 'p-3';

  /* Data processing */
  const processedRows = useMemo(() => {
    let filtered = rows;
    if (searchQuery) {
      filtered = filtered.filter((row) =>
        Object.values(row).some((value) =>
          String(value).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    filterRules
      .filter((rule) => rule.value != null && String(rule.value).trim() !== '')
      .forEach((rule) => {
        filtered = filtered.filter((row) => {
          const cellValue = String(
            (row as any)[rule.field] || ''
          ).toLowerCase();
          const filterValue = String(rule.value || '').toLowerCase();
          switch (rule.operator) {
            case 'contains':
              return cellValue.includes(filterValue);
            case 'equals':
              return cellValue === filterValue;
            case 'startsWith':
              return cellValue.startsWith(filterValue);
            case 'endsWith':
              return cellValue.endsWith(filterValue);
            case 'isEmpty':
              return !cellValue || cellValue.trim() === '';
            case 'isNotEmpty':
              return cellValue && cellValue.trim() !== '';
            default:
              return cellValue.includes(filterValue);
          }
        });
      });
    Object.entries(filterModel).forEach(([field, filterValue]) => {
      if (filterValue) {
        filtered = filtered.filter((row) =>
          String((row as any)[field])
            .toLowerCase()
            .includes(String(filterValue).toLowerCase())
        );
      }
    });
    return filtered;
  }, [rows, searchQuery, filterModel, filterRules]);

  const sortedRows = useMemo(() => {
    if (sortModel.length === 0) return processedRows;
    return [...processedRows].sort((a, b) => {
      for (const sort of sortModel) {
        const column = columns.find((col) => col.field === sort.field);
        let aVal: any, bVal: any;
        if (column?.valueGetter) {
          aVal = column.valueGetter({
            id: (a as any).id || (a as any)[idField] || 0,
            row: a,
            field: sort.field,
            value: (a as any)[sort.field],
            colDef: column,
            api,
          });
          bVal = column.valueGetter({
            id: (b as any).id || (b as any)[idField] || 0,
            row: b,
            field: sort.field,
            value: (b as any)[sort.field],
            colDef: column,
            api,
          });
        } else {
          aVal = (a as any)[sort.field];
          bVal = (b as any)[sort.field];
        }
        let comparison = 0;
        if (aVal < bVal) comparison = -1;
        if (aVal > bVal) comparison = 1;
        if (comparison !== 0)
          return sort.sort === 'asc' ? comparison : -comparison;
      }
      return 0;
    });
  }, [processedRows, sortModel, columns]);

  const paginatedRows = useMemo(() => {
    const startIndex = page * currentPageSize;
    return sortedRows.slice(startIndex, startIndex + currentPageSize);
  }, [sortedRows, page, currentPageSize]);

  const totalPages = Math.ceil(sortedRows.length / currentPageSize);

  // Tri-state selection over the rows in the current page
  const pageRowIds = useMemo(
    () =>
      paginatedRows.map((row) =>
        String((row as any)[idField as any] ?? (row as any).id)
      ),
    [paginatedRows, idField]
  );
  const selectedOnPageCount = useMemo(
    () => pageRowIds.filter((id) => selectedRows.includes(id)).length,
    [pageRowIds, selectedRows]
  );
  const allChecked =
    pageRowIds.length > 0 && selectedOnPageCount === pageRowIds.length;
  const isIndeterminate =
    selectedOnPageCount > 0 && selectedOnPageCount < pageRowIds.length;

  const handleSort = (field: string) => {
    const existingSort = sortModel.find((sort) => sort.field === field);
    let newSortModel: SortModel[];
    if (!existingSort) newSortModel = [{ field, sort: 'asc' }];
    else if (existingSort.sort === 'asc')
      newSortModel = [{ field, sort: 'desc' }];
    else newSortModel = [];
    setSortModel(newSortModel);
    onSortModelChange?.(newSortModel);
  };

  // Match editor font-size to grid density so text doesn't grow/shrink on edit
  const editorInputSize =
    density === 'compact' ? 'xs' : density === 'comfortable' ? 'md' : 'sm';

  /* Filter editing (temp) */
  const addFilterRule = () => {
    setTempFilterRules((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        field: columns[0]?.field || '',
        operator: 'contains',
        value: '',
      },
    ]);
  };
  const removeFilterRule = (id: string) =>
    setTempFilterRules((prev) => prev.filter((r) => r.id !== id));
  const updateFilterRule = (id: string, updates: Partial<FilterRule>) => {
    setTempFilterRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedRows((prev) => {
      const set = new Set(prev);
      if (checked) {
        pageRowIds.forEach((id) => set.add(id));
      } else {
        pageRowIds.forEach((id) => set.delete(id));
      }
      const next = Array.from(set);
      onSelectionModelChange?.(next);
      return next;
    });
  };

  const handleRowSelection = useCallback(
    (rowId: string, checked: boolean) => {
      setSelectedRows((prev) => {
        const set = new Set(prev);
        if (checked) set.add(rowId);
        else set.delete(rowId);
        const next = Array.from(set);
        onSelectionModelChange?.(next);
        return next;
      });
    },
    [onSelectionModelChange]
  );

  const handleDragStart = (e: React.DragEvent, columnField: string) => {
    setIsDragging(columnField);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnField);
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    setTimeout(() => document.body.removeChild(dragImage), 0);
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    const sourceField = e.dataTransfer.getData('text/plain');
    if (sourceField !== targetField) {
      const newOrder = [...columnOrder];
      const sourceIndex = newOrder.indexOf(sourceField);
      const targetIndex = newOrder.indexOf(targetField);
      newOrder.splice(sourceIndex, 1);
      newOrder.splice(targetIndex, 0, sourceField);
      setColumnOrder(newOrder);
    }
    setIsDragging(null);
  };

  const handleResizeStart = (e: React.MouseEvent, columnField: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(columnField);
    setDragStartX(e.clientX);
    setDragStartWidth(columnWidths[columnField] || 150);
  };
  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const diff = e.clientX - dragStartX;
      const newWidth = Math.max(50, dragStartWidth + diff);
      setColumnWidths((prev) => ({ ...prev, [isResizing]: newWidth }));
    },
    [isResizing, dragStartX, dragStartWidth]
  );
  const handleResizeEnd = useCallback(() => setIsResizing(null), []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      return () => {
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeEnd);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleResizeMove, handleResizeEnd]);

  // Align popovers
  useEffect(() => {
    if (showFilterPopover && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setFilterPopoverPosition({
        top: rect.bottom + 4,
        left: rect.right - 448,
      });
    }
  }, [showFilterPopover]);
  useEffect(() => {
    if (showExportPopover && exportButtonRef.current) {
      const rect = exportButtonRef.current.getBoundingClientRect();
      setExportPopoverPosition({
        top: rect.bottom + 4,
        left: rect.right - 192,
      });
    }
  }, [showExportPopover]);
  useEffect(() => {
    if (showColumnPopover && columnButtonRef.current) {
      const rect = columnButtonRef.current.getBoundingClientRect();
      setColumnPopoverPosition({
        top: rect.bottom + 4,
        left: rect.right - 320,
      });
    }
  }, [showColumnPopover]);

  // Close export/columns on scroll (keep filter stable)
  useEffect(() => {
    if (!showExportPopover) return;
    const handleScroll = (event: Event) => {
      if (
        exportPopoverRef.current &&
        exportPopoverRef.current.contains(event.target as Node)
      )
        return;
      setShowExportPopover(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showExportPopover]);
  useEffect(() => {
    if (!showColumnPopover) return;
    const handleScroll = (event: Event) => {
      if (
        columnPopoverRef.current &&
        columnPopoverRef.current.contains(event.target as Node)
      )
        return;
      setShowColumnPopover(false);
    };
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [showColumnPopover]);

  /* Editing cells */
  const handleCellDoubleClick = (
    rowId: string | number,
    field: string,
    currentValue: any
  ) => {
    // Per-column editing only: editable must be true and no valueGetter
    const col = columns.find((c) => c.field === field);
    if (!col || col.editable !== true || col.valueGetter) return;
    setEditingCell({
      rowId: (rowId as any) ?? '',
      field,
    });
    setEditValue(currentValue);
  };

  const handleEditSave = () => {
    if (!editingCell) return;
    const { rowId, field } = editingCell;
    const col = columns.find((c) => c.field === field);

    let finalValue = editValue;

    // Coerce by column.type
    const t = (col?.type as string | undefined) ?? 'string';
    if (t === 'number') {
      if (
        finalValue === '' ||
        finalValue === null ||
        finalValue === undefined
      ) {
        finalValue = null;
      } else {
        const n = Number(finalValue);
        finalValue = Number.isNaN(n) ? null : n;
      }
    } else if (t === 'boolean') {
      finalValue = Boolean(finalValue);
    } else {
      // string default
      finalValue = String(finalValue ?? '');
    }

    const updatedRows = rows.map((row) =>
      String((row as any)[idField as any] ?? (row as any).id) === String(rowId)
        ? { ...(row as any), [field]: finalValue }
        : row
    );
    setRows(updatedRows);
    onCellValueChange?.({
      id: rowId,
      field,
      value: finalValue,
    });
    onRowsChange?.(updatedRows);
    setEditingCell(null);
    setEditValue(null);
  };

  const handleEditCancel = () => {
    setEditingCell(null);
    setEditValue(null);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleEditSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleEditCancel();
    }
  };

  const renderEditor = (column: Column) => {
    const t = (column.type as string | undefined) ?? 'string';
    const align =
      column.align === 'center'
        ? 'text-center'
        : column.align === 'right'
        ? 'text-right'
        : 'text-left';

    // boolean → Checkbox centered in the cell
    if (t === 'boolean') {
      return (
        <div className="w-full h-full flex items-center justify-center">
          <Checkbox
            checked={Boolean(editValue)}
            onChange={(e) => setEditValue(e.target.checked)}
            onKeyDown={handleEditKeyDown}
            onBlur={handleEditSave}
          />
        </div>
      );
    }

    // common props for Input (string/number)
    const commonProps = {
      inputSize: editorInputSize as any, // keep font-size in sync with grid density
      variant: 'ghost' as const,
      fullWidth: true,
      className: cn(
        'w-full h-full !m-0 !p-0 !bg-transparent !border-none focus:!ring-0 focus:!outline-none block text-black',
        align
      ),
      style: {
        fontSize: 'inherit',
        lineHeight: 'inherit',
      } as React.CSSProperties,
      autoFocus: true,
      onKeyDown: handleEditKeyDown,
      onBlur: handleEditSave,
    };

    if (t === 'number') {
      return (
        <Input
          type="number"
          value={editValue ?? ''}
          onChange={(e) =>
            setEditValue(e.target.value === '' ? '' : Number(e.target.value))
          }
          {...commonProps}
        />
      );
    }

    // default string
    return (
      <Input
        type="text"
        value={editValue ?? ''}
        onChange={(e) => setEditValue(e.target.value)}
        {...commonProps}
      />
    );
  };

  const renderCell = (row: any, column: Column) => {
    const value = column.valueGetter
      ? column.valueGetter({
          id: (row as any)[idField],
          row,
          field: column.field,
          value: (row as any)[column.field],
          colDef: column,
          api,
        })
      : (row as any)[column.field];

    const isCellEditable = column.editable === true && !column.valueGetter;
    const isCurrentlyEditing =
      editingCell?.rowId ===
        String((row as any)[idField as any] ?? (row as any).id) &&
      editingCell?.field === column.field;

    if (isCurrentlyEditing) {
      return (
        <div
          className={cn(
            'absolute inset-0 ring-2 ring-inset ring-blue-500/60 bg-blue-50/40 rounded-sm',
            getCellPadding()
          )}
        >
          {renderEditor(column)}
        </div>
      );
    }

    if (column.renderCell) {
      return column.renderCell({
        id: (row as any)[idField],
        value,
        row,
        field: column.field,
        colDef: column,
        cellMode: 'view',
        hasFocus: false,
        tabIndex: 0,
        api,
      });
    }

    return (
      <div
        className={cn('truncate', isCellEditable && 'cursor-text')}
        onDoubleClick={() => {
          if (isCellEditable) {
            setEditingCell({
              rowId: String((row as any)[idField as any] ?? (row as any).id),
              field: column.field,
            });
            setEditValue(value);
          }
        }}
      >
        {String(value ?? '')}
      </div>
    );
  };

  // Treat clicks from controls as non-row-selection clicks (like MUI)
  const isInteractiveTarget = (el: HTMLElement | null) =>
    !!el?.closest(
      'button, a, input, select, textarea, [role="button"], [role="link"]'
    );

  const handleRowClick = (row: any, event: React.MouseEvent) => {
    if (!checkboxSelection || !checkboxSelectionOnRowClick) return;
    const target = event.target as HTMLElement;
    if (isInteractiveTarget(target)) return;
    if (
      editingCell &&
      String(editingCell.rowId) ===
        String((row as any)[idField as any] ?? (row as any).id)
    )
      return;

    const rowId = String((row as any)[idField as any] ?? (row as any).id);
    const willBeChecked = !selectedRows.includes(rowId);
    handleRowSelection(rowId, willBeChecked);
  };

  /* Badge count */
  const isValueLessOperator = (op: FilterRule['operator']) =>
    op === 'isEmpty' || op === 'isNotEmpty';
  const isRuleActive = (r: FilterRule) =>
    isValueLessOperator(r.operator) || String(r.value ?? '').trim() !== '';
  const ruleKey = (r: {
    field: string;
    operator: FilterRule['operator'];
    value?: string;
  }) => {
    const val = String(r.value ?? '').trim();
    return isValueLessOperator(r.operator)
      ? `${r.field}|${r.operator}`
      : `${r.field}|${r.operator}|${val}`;
  };
  const getFilterBadgeCount = () => {
    const sourceRules = showFilterPopover ? tempFilterRules : filterRules;
    const activeAdvanced = sourceRules.filter(isRuleActive);
    const keys = new Set(activeAdvanced.map(ruleKey));
    if (enableColumnFilters) {
      for (const [field, rawVal] of Object.entries(filterModel)) {
        const value = String(rawVal ?? '').trim();
        if (!value) continue;
        const k = ruleKey({ field, operator: 'contains', value });
        if (!keys.has(k)) keys.add(k);
      }
    }
    return keys.size;
  };
  const badgeCount = getFilterBadgeCount();

  useEffect(() => {
    if (showFilterPopover) setTempFilterRules(filterRules);
  }, [showFilterPopover, filterRules]);

  return (
    <div className={cn('border rounded-lg bg-white', className)}>
      {/* TOOLBAR */}
      {!hideToolbar && (
        <DataGridToolbar
          hideSearch={hideSearch}
          hideFilters={hideFilters}
          hideExport={hideExport}
          hideColumns={hideColumns}
          hideFilterLabel={hideFilterLabel}
          hideExportLabel={hideExportLabel}
          hideColumnsLabel={hideColumnsLabel}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          badgeCount={badgeCount}
          showFilterPopover={showFilterPopover}
          setShowFilterPopover={setShowFilterPopover}
          filterButtonRef={filterButtonRef}
          filterPopoverRef={filterPopoverRef}
          filterPopoverPosition={filterPopoverPosition}
          tempFilterRules={tempFilterRules}
          committedFilters={filterRules}
          onChangeFilterValue={(id, v) => updateFilterRule(id, { value: v })}
          onChangeFilterField={(id, field) => updateFilterRule(id, { field })}
          onChangeFilterOperator={(id, op) =>
            updateFilterRule(id, { operator: op as any })
          }
          onAddFilter={addFilterRule}
          onRemoveFilter={removeFilterRule}
          onClearTempFilters={() => setTempFilterRules([])}
          setFilterRules={setFilterRules}
          setFilterModel={setFilterModel}
          onFilterModelChange={onFilterModelChange}
          availableFields={columns.map((c) => ({
            field: c.field,
            label: c.headerName ?? c.field,
          }))}
          showExportPopover={showExportPopover}
          setShowExportPopover={setShowExportPopover}
          exportButtonRef={exportButtonRef}
          exportPopoverRef={exportPopoverRef}
          exportPopoverPosition={exportPopoverPosition}
          onExportCsv={() => api.exportDataAsCsv()}
          onExportJson={() => api.exportDataAsJson()}
          showColumnPopover={showColumnPopover}
          setShowColumnPopover={setShowColumnPopover}
          columnButtonRef={columnButtonRef}
          columnPopoverRef={columnPopoverRef}
          columnPopoverPosition={columnPopoverPosition}
          columnSearchQuery={columnSearchQuery}
          setColumnSearchQuery={setColumnSearchQuery}
          filteredColumns={filteredColumns}
          tempColumnVisibility={tempColumnVisibility}
          setTempColumnVisibility={setTempColumnVisibility}
          setColumnVisibility={setColumnVisibility}
          columns={columns}
        />
      )}

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table
          className={`w-full ${getDensityClasses()}`}
          style={{ minWidth: 'max-content' }}
          ref={tableRef}
        >
          <thead className="bg-gray-50 border-b-2">
            <tr>
              {checkboxSelection &&
                orderedColumns.filter(
                  (col) => columnVisibility[col.field] !== false
                ).length > 0 && (
                  <th
                    className={`w-12 ${getHeaderPadding()} text-center border-r last:border-r-0`}
                  >
                    <div className="flex items-center justify-center">
                      <Checkbox
                        checked={allChecked}
                        indeterminate={isIndeterminate}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleSelectAll(e.target.checked);
                        }}
                        disabled={pageRowIds.length === 0}
                      />
                    </div>
                  </th>
                )}
              {orderedColumns
                .filter((col) => columnVisibility[col.field] !== false)
                .map((column) => (
                  <th
                    key={column.field}
                    className={`${getHeaderPadding()} text-left font-medium border-r last:border-r-0 relative group ${
                      isDragging === column.field ? 'opacity-50' : ''
                    }`}
                    style={{
                      width: columnWidths[column.field] || column.width || 150,
                    }}
                    onDragOver={
                      enableColumnReorder
                        ? (e) => {
                            e.preventDefault();
                            e.dataTransfer.dropEffect = 'move';
                          }
                        : undefined
                    }
                    onDrop={
                      enableColumnReorder
                        ? (e) => handleDrop(e, column.field)
                        : undefined
                    }
                    onMouseEnter={() => setHoveredColumn(column.field)}
                    onMouseLeave={() => setHoveredColumn(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <span
                          className={`truncate select-none ${
                            enableColumnReorder
                              ? 'cursor-grab active:cursor-grabbing'
                              : ''
                          }`}
                          draggable={enableColumnReorder}
                          onDragStart={
                            enableColumnReorder
                              ? (e) => handleDragStart(e, column.field)
                              : undefined
                          }
                          onDragEnd={
                            enableColumnReorder
                              ? () => setIsDragging(null)
                              : undefined
                          }
                        >
                          {column.headerName}
                        </span>

                        {column.sortable !== false && (
                          <button
                            onClick={() => handleSort(column.field)}
                            className={`ml-1 p-1 hover:bg-gray-200 rounded transition-opacity ${
                              hoveredColumn === column.field ||
                              sortModel.find((s) => s.field === column.field)
                                ? 'opacity-100'
                                : 'opacity-0'
                            }`}
                          >
                            {sortModel.find((s) => s.field === column.field)
                              ?.sort === 'asc' ? (
                              <ChevronUp />
                            ) : sortModel.find((s) => s.field === column.field)
                                ?.sort === 'desc' ? (
                              <ChevronDown />
                            ) : (
                              <ChevronUp />
                            )}
                          </button>
                        )}
                      </div>

                      {!disableColumnResize && (
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                          onMouseDown={(e) =>
                            handleResizeStart(e, column.field)
                          }
                        />
                      )}
                    </div>
                  </th>
                ))}
            </tr>
          </thead>
          <tbody>
            {enableColumnFilters && (
              <tr className="bg-gray-50 border-b">
                {checkboxSelection &&
                  orderedColumns.filter(
                    (col) => columnVisibility[col.field] !== false
                  ).length > 0 && <td className="w-12 p-2 border-r" />}
                {orderedColumns
                  .filter((col) => columnVisibility[col.field] !== false)
                  .map((column) => (
                    <td
                      key={`filter-${column.field}`}
                      className="p-2 border-r last:border-r-0"
                      style={{
                        width:
                          columnWidths[column.field] || column.width || 150,
                      }}
                    >
                      <Input
                        placeholder={`Filter ${column.headerName}...`}
                        value={filterModel[column.field] || ''}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setFilterModel((prev) => {
                            const next = { ...prev };
                            if (newValue && newValue.trim() !== '')
                              (next as any)[column.field] = newValue;
                            else delete (next as any)[column.field];
                            return next;
                          });
                          setFilterRules((prevRules) => {
                            const existingRuleIndex = prevRules.findIndex(
                              (rule) =>
                                rule.field === column.field &&
                                rule.operator === 'contains'
                            );
                            if (newValue && newValue.trim() !== '') {
                              if (existingRuleIndex >= 0) {
                                const newRules = [...prevRules];
                                newRules[existingRuleIndex] = {
                                  ...newRules[existingRuleIndex],
                                  value: newValue,
                                };
                                return newRules;
                              } else {
                                return [
                                  ...prevRules,
                                  {
                                    id: Math.random().toString(36).slice(2, 9),
                                    field: column.field,
                                    operator: 'contains',
                                    value: newValue,
                                  },
                                ];
                              }
                            } else {
                              if (existingRuleIndex >= 0)
                                return prevRules.filter(
                                  (_, index) => index !== existingRuleIndex
                                );
                              return prevRules;
                            }
                          });
                        }}
                        inputSize="sm"
                        variant="default"
                        fullWidth
                      />
                    </td>
                  ))}
              </tr>
            )}
            {orderedColumns.filter(
              (col) => columnVisibility[col.field] !== false
            ).length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (checkboxSelection ? 1 : 0)}
                  className={`${getCellPadding()} text-center text-gray-500 py-12`}
                >
                  <div>
                    <div className="text-lg font-medium mb-2">No Columns</div>
                    <div className="text-sm mb-4">
                      All columns are currently hidden
                    </div>
                  </div>
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    orderedColumns.filter(
                      (col) => columnVisibility[col.field] !== false
                    ).length +
                    (checkboxSelection &&
                    orderedColumns.filter(
                      (col) => columnVisibility[col.field] !== false
                    ).length > 0
                      ? 1
                      : 0)
                  }
                  className={`${getCellPadding()} text-center text-gray-500 py-12`}
                >
                  {typeof noDataMessage === 'string' ? (
                    <div>
                      <div className="text-lg font-medium mb-2">No Data</div>
                      <div className="text-sm">{noDataMessage}</div>
                    </div>
                  ) : (
                    noDataMessage
                  )}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={(row as any).id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    selectedRows.includes(
                      String((row as any)[idField as any] ?? (row as any).id)
                    )
                      ? 'bg-blue-50'
                      : ''
                  } ${!hideGridLines ? 'border-b' : ''}`}
                  onClick={(e) => handleRowClick(row, e)}
                  style={{
                    cursor:
                      checkboxSelectionOnRowClick && checkboxSelection
                        ? 'pointer'
                        : 'default',
                  }}
                >
                  {checkboxSelection &&
                    orderedColumns.filter(
                      (col) => columnVisibility[col.field] !== false
                    ).length > 0 && (
                      <td
                        className={`${getCellPadding()} ${
                          !hideGridLines ? 'border-r' : ''
                        } text-center`}
                      >
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={selectedRows.includes(
                              String(
                                (row as any)[idField as any] ?? (row as any).id
                              )
                            )}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleRowSelection(
                                String(
                                  (row as any)[idField as any] ??
                                    (row as any).id
                                ),
                                e.target.checked
                              );
                            }}
                          />
                        </div>
                      </td>
                    )}
                  {orderedColumns
                    .filter((col) => columnVisibility[col.field] !== false)
                    .map((column) => {
                      return (
                        <td
                          key={column.field}
                          className={`${getCellPadding()} ${
                            !hideGridLines ? 'border-r last:border-r-0' : ''
                          } truncate ${
                            column.align === 'center'
                              ? 'text-center'
                              : column.align === 'right'
                              ? 'text-right'
                              : 'text-left'
                          } relative`}
                          style={{
                            width:
                              columnWidths[column.field] || column.width || 150,
                          }}
                          onDoubleClick={() =>
                            handleCellDoubleClick(
                              String(
                                (row as any)[idField as any] ?? (row as any).id
                              ),
                              column.field,
                              (row as any)[column.field]
                            )
                          }
                        >
                          {renderCell(row, column)}
                        </td>
                      );
                    })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      {!hideFooter && (
        <DataGridFooter
          hideRowsPerPage={hideRowsPerPage}
          pageSizeOptions={pageSizeOptions}
          currentPageSize={currentPageSize}
          onPageSizeChange={(n) => {
            setCurrentPageSize(n);
            setPage(0);
          }}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          sortedRowsLength={sortedRows.length}
        />
      )}
    </div>
  );
});

DataGrid.displayName = 'DataGrid';

export { DataGrid };
export default DataGrid;
