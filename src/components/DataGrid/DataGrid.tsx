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
import {
  Search,
  Filter,
  Download,
  Settings,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  Plus,
} from 'lucide-react';
import { Input } from '../ui/Input/Input';
import { Checkbox } from '../ui/Checkbox/Checkbox';
import { Select } from '../ui/Select/Select';
import { Button } from '../ui/Button/Button';
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
  GridPaginationModel,
  GridSortItem,
  GridEventMap,
} from '../../types/api';
import { createPortal } from 'react-dom';
import type { Column } from '../../types';

const DataGrid = forwardRef<GridApiRef, DataGridProps>(
  (
    {
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
      noDataMessage = 'No data available',
      apiRef,
      isEditable = false,
      onCellValueChange,
      checkboxSelectionOnRowClick = false,
      onRowsChange,
      idField = 'id',
    },
    ref
  ) => {
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

    // Add popover state declarations here
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

    // Event listeners
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
    const [editValue, setEditValue] = useState<string>('');

    // Add the filtered columns memoization here, after the state declarations
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

    // API Implementation
    const api: GridApiRef = useMemo(
      () => ({
        // Row methods
        getRow: (id: string | number) => {
          return rows.find((row) => row.id === id) || null;
        },
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
        setRows: (newRows: GridRowModel[]) => {
          // This would need to be implemented with a callback to parent
          console.warn('setRows not implemented - use controlled rows prop');
        },
        updateRows: (updates: GridRowModel[]) => {
          console.warn('updateRows not implemented - use controlled rows prop');
        },

        // Selection methods
        selectRow: (
          id: string | number,
          isSelected = true,
          resetSelection = false
        ) => {
          const newSelection = resetSelection
            ? new Set<string>()
            : new Set(selectedRows);
          if (isSelected) {
            newSelection.add(String(id));
          } else {
            newSelection.delete(String(id));
          }
          setSelectedRows(Array.from(newSelection));
          onSelectionModelChange?.(Array.from(newSelection));
        },
        selectRows: (
          ids: (string | number)[],
          isSelected = true,
          resetSelection = false
        ) => {
          const newSelection = resetSelection
            ? new Set<string>()
            : new Set(selectedRows);
          ids.forEach((id) => {
            if (isSelected) {
              newSelection.add(String(id));
            } else {
              newSelection.delete(String(id));
            }
          });
          setSelectedRows(Array.from(newSelection));
          onSelectionModelChange?.(Array.from(newSelection));
        },
        selectRowRange: (range, isSelected = true, resetSelection = false) => {
          // Implementation for range selection
          console.warn('selectRowRange not fully implemented');
        },
        deselectRow: (id: string | number) => {
          api.selectRow(id, false);
        },
        deselectRows: (ids: (string | number)[]) => {
          api.selectRows(ids, false);
        },
        selectAll: () => {
          const allIds = rows.map((row) => String(row.id));
          setSelectedRows(allIds);
          onSelectionModelChange?.(allIds);
        },
        deselectAll: () => {
          setSelectedRows([]);
          onSelectionModelChange?.([]);
        },
        isRowSelected: (id: string | number) => {
          return selectedRows.includes(String(id));
        },
        getSelectedRowIds: () => {
          return Array.from(selectedRows);
        },
        setSelectionModel: (model: (string | number)[]) => {
          const newSelection = model.map((id) => String(id));
          setSelectedRows(newSelection);
          onSelectionModelChange?.(model.map((id) => String(id)));
        },

        // Column methods
        getColumn: (field: string) => {
          return columns.find((col) => col.field === field) || null;
        },
        getAllColumns: () => columns,
        getVisibleColumns: () => {
          return orderedColumns.filter((col) => columnVisibility[col.field]);
        },
        getColumnIndex: (field: string, useVisibleColumns = false) => {
          const cols = useVisibleColumns ? api.getVisibleColumns() : columns;
          return cols.findIndex((col) => col.field === field);
        },
        getColumnPosition: (field: string) => {
          return columnOrder.indexOf(field);
        },
        setColumnVisibility: (field: string, isVisible: boolean) => {
          setColumnVisibility((prev) => ({ ...prev, [field]: isVisible }));
        },
        setColumnsVisibility: (model: ColumnVisibility) => {
          setColumnVisibility(model);
        },
        getColumnVisibilityModel: () => columnVisibility,
        setColumnWidth: (field: string, width: number) => {
          setColumnWidths((prev) => ({ ...prev, [field]: width }));
        },
        setColumnOrder: (fields: string[]) => {
          setColumnOrder(fields);
        },
        getColumnOrder: () => columnOrder,

        // Sorting methods
        getSortModel: () => {
          return sortModel.map((sort) => ({
            field: sort.field,
            sort: sort.sort,
          }));
        },
        setSortModel: (model: GridSortItem[]) => {
          const newSortModel = model.map((item) => ({
            field: item.field,
            sort: item.sort!,
          }));
          setSortModel(newSortModel);
          onSortModelChange?.(newSortModel);
        },
        sortColumn: (
          field: string,
          direction: 'asc' | 'desc' | null = 'asc',
          allowMultiple = false
        ) => {
          if (direction === null) {
            const newSortModel = sortModel.filter(
              (sort) => sort.field !== field
            );
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
              id: Math.random().toString(36).substr(2, 9),
              field: item.field,
              operator: item.operator as FilterRule['operator'],
              value: item.value,
            }));

          setFilterRules(newRules);
          onFilterModelChange?.(newRules);
        },
        setQuickFilterValues: (values: string[]) => {
          setSearchQuery(values.join(' '));
        },
        showFilterPanel: (targetColumnField?: string) => {
          setShowFilterPopover(true);
        },
        hideFilterPanel: () => {
          setShowFilterPopover(false);
        },

        // Pagination methods
        getPaginationModel: () => ({
          page,
          pageSize: currentPageSize,
        }),
        setPaginationModel: (model: GridPaginationModel) => {
          setPage(model.page);
          setCurrentPageSize(model.pageSize);
        },
        setPage: (newPage: number) => {
          setPage(newPage);
        },
        setPageSize: (newPageSize: number) => {
          setCurrentPageSize(newPageSize);
          setPage(0);
        },

        // Export methods
        getDataAsCsv: (options = {}) => {
          return GridExportUtils.getDataAsCsv(api, options);
        },
        exportDataAsCsv: (options = {}) => {
          GridExportUtils.exportToCsv(api, options);
        },
        getDataAsJson: (options = {}) => {
          return GridExportUtils.getDataAsJson(api, options);
        },
        exportDataAsJson: (options = {}) => {
          GridExportUtils.exportToJson(api, options);
        },

        // Scroll methods
        scrollToIndexes: (params) => {
          console.warn('scrollToIndexes not implemented');
          return false;
        },
        getScrollPosition: () => ({ top: 0, left: 0 }),
        scroll: (params) => {
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
              .filter((col) => columnVisibility[col.field])
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
        setState: (stateUpdater) => {
          console.warn('setState not implemented');
        },
        forceUpdate: () => {
          console.warn('forceUpdate not implemented');
        },

        // Utility methods
        getCellValue: (id: string | number, field: string) => {
          const row = rows.find((r) => r.id === id);
          return row ? row[field] : null;
        },
        setCellValue: (id: string | number, field: string, value: any) => {
          console.warn(
            'setCellValue not implemented - use controlled rows prop'
          );
        },
        getRowNode: (id: string | number) => {
          return { id, parent: null, depth: 0 };
        },

        // Event methods
        subscribeEvent: <T extends keyof GridEventMap>(
          event: T,
          handler: GridEventMap[T]
        ) => {
          if (!eventListeners.current.has(event)) {
            eventListeners.current.set(event, new Set());
          }
          eventListeners.current.get(event)!.add(handler);

          return () => {
            eventListeners.current.get(event)?.delete(handler);
          };
        },
        publishEvent: <T extends keyof GridEventMap>(
          event: T,
          params: Parameters<GridEventMap[T]>[0]
        ) => {
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

    // Expose API through ref
    useImperativeHandle(ref, () => api, [api]);

    // Also expose through apiRef prop if provided
    useEffect(() => {
      if (apiRef) {
        apiRef.current = api;
      }
    }, [apiRef, api]);

    // Add this helper function near the top of the component, after the state declarations
    const getActiveFilterCount = () => {
      const advancedFilters = filterRules.filter(
        (rule) => rule.value != null && String(rule.value).trim() !== ''
      ).length;
      const columnFilters = Object.values(filterModel).filter(
        (value) => value != null && String(value).trim() !== ''
      ).length;
      return advancedFilters + columnFilters;
    };

    const orderedColumns = useMemo(() => {
      return columnOrder
        .map((fieldName) => columns.find((col) => col.field === fieldName))
        .filter(Boolean) as typeof columns;
    }, [columnOrder, columns]);

    const getDensityClasses = () => {
      switch (density) {
        case 'compact':
          return 'text-xs';
        case 'comfortable':
          return 'text-base';
        default:
          return 'text-sm';
      }
    };

    const getCellPadding = () => {
      switch (density) {
        case 'compact':
          return 'p-1';
        case 'comfortable':
          return 'p-3';
        default:
          return 'p-2';
      }
    };

    const getHeaderPadding = () => {
      switch (density) {
        case 'compact':
          return 'p-2';
        case 'comfortable':
          return 'p-4';
        default:
          return 'p-3';
      }
    };

    const processedRows = useMemo(() => {
      let filtered = rows;

      // Search filter
      if (searchQuery) {
        filtered = filtered.filter((row) =>
          Object.values(row).some((value) =>
            String(value).toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      }

      // Advanced filters
      filterRules
        .filter(
          (rule) => rule.value != null && String(rule.value).trim() !== ''
        )
        .forEach((rule) => {
          filtered = filtered.filter((row) => {
            const cellValue = String(row[rule.field] || '').toLowerCase();
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

      // Column filters
      Object.entries(filterModel).forEach(([field, filterValue]) => {
        if (filterValue) {
          filtered = filtered.filter((row) =>
            String(row[field]).toLowerCase().includes(filterValue.toLowerCase())
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

          let aVal, bVal;
          if (column?.valueGetter) {
            aVal = column.valueGetter({
              id: a.id || a[idField] || 0,
              row: a,
              field: sort.field,
              value: a[sort.field],
              colDef: column,
              api,
            });
            bVal = column.valueGetter({
              id: b.id || b[idField] || 0,
              row: b,
              field: sort.field,
              value: b[sort.field],
              colDef: column,
              api,
            });
          } else {
            aVal = a[sort.field];
            bVal = b[sort.field];
          }

          let comparison = 0;

          if (aVal < bVal) comparison = -1;
          if (aVal > bVal) comparison = 1;

          if (comparison !== 0) {
            return sort.sort === 'asc' ? comparison : -comparison;
          }
        }
        return 0;
      });
    }, [processedRows, sortModel, columns]);

    const paginatedRows = useMemo(() => {
      const startIndex = page * currentPageSize;
      return sortedRows.slice(startIndex, startIndex + currentPageSize);
    }, [sortedRows, page, currentPageSize]);

    const totalPages = Math.ceil(sortedRows.length / currentPageSize);

    const handleSort = (field: string) => {
      const existingSort = sortModel.find((sort) => sort.field === field);
      let newSortModel: SortModel[];

      if (!existingSort) {
        newSortModel = [{ field, sort: 'asc' }];
      } else if (existingSort.sort === 'asc') {
        newSortModel = [{ field, sort: 'desc' }];
      } else {
        newSortModel = [];
      }

      setSortModel(newSortModel);
      onSortModelChange?.(newSortModel);
    };

    const addFilterRule = () => {
      setTempFilterRules([
        ...tempFilterRules,
        {
          id: Math.random().toString(36).substr(2, 9),
          field: columns[0]?.field || '',
          operator: 'contains',
          value: '',
        },
      ]);
    };

    const removeFilterRule = (id: string) => {
      setTempFilterRules(tempFilterRules.filter((rule) => rule.id !== id));
    };

    const updateFilterRule = (id: string, updates: Partial<FilterRule>) => {
      setTempFilterRules(
        tempFilterRules.map((rule) =>
          rule.id === id ? { ...rule, ...updates } : rule
        )
      );
    };

    const handleRowSelection = (rowId: string, checked: boolean) => {
      const newSelection = new Set(selectedRows);
      if (checked) {
        newSelection.add(rowId);
      } else {
        newSelection.delete(rowId);
      }
      setSelectedRows(Array.from(newSelection));
      onSelectionModelChange?.(Array.from(newSelection));
    };

    const handleSelectAll = (checked: boolean) => {
      if (checked) {
        const allIds = new Set(paginatedRows.map((row) => row.id));
        setSelectedRows(Array.from(allIds));
        onSelectionModelChange?.(Array.from(allIds));
      } else {
        setSelectedRows([]);
        onSelectionModelChange?.([]);
      }
    };

    const handleDragStart = (e: React.DragEvent, columnField: string) => {
      setIsDragging(columnField);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', columnField);

      // Create drag image
      const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
      dragImage.style.opacity = '0.8';
      dragImage.style.transform = 'rotate(2deg)';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, targetField: string) => {
      e.preventDefault();
      const sourceField = e.dataTransfer.getData('text/plain');

      if (sourceField !== targetField) {
        const newOrder = [...columnOrder];
        const sourceIndex = newOrder.indexOf(sourceField);
        const targetIndex = newOrder.indexOf(targetField);

        // Remove source and insert at target position
        newOrder.splice(sourceIndex, 1);
        newOrder.splice(targetIndex, 0, sourceField);

        setColumnOrder(newOrder);
      }

      setIsDragging(null);
    };

    const handleDragEnd = () => {
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

        setColumnWidths((prev) => ({
          ...prev,
          [isResizing]: newWidth,
        }));
      },
      [isResizing, dragStartX, dragStartWidth]
    );

    const handleResizeEnd = useCallback(() => {
      setIsResizing(null);
    }, []);

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

    useEffect(() => {
      if (showFilterPopover) {
        // Keep temp filter rules in sync with column filters
        const syncedRules = [...tempFilterRules];
        let hasChanges = false;

        Object.entries(filterModel).forEach(([field, value]) => {
          const existingRuleIndex = syncedRules.findIndex(
            (rule) => rule.field === field && rule.operator === 'contains'
          );

          if (value) {
            if (existingRuleIndex >= 0) {
              if (syncedRules[existingRuleIndex].value !== value) {
                syncedRules[existingRuleIndex] = {
                  ...syncedRules[existingRuleIndex],
                  value,
                };
                hasChanges = true;
              }
            } else {
              syncedRules.push({
                id: Math.random().toString(36).substr(2, 9),
                field,
                operator: 'contains',
                value,
              });
              hasChanges = true;
            }
          } else {
            if (existingRuleIndex >= 0) {
              syncedRules.splice(existingRuleIndex, 1);
              hasChanges = true;
            }
          }
        });

        if (hasChanges) {
          setTempFilterRules(syncedRules);
        }
      }
    }, [filterModel, showFilterPopover]);

    useEffect(() => {
      if (showExportPopover && exportButtonRef.current) {
        const rect = exportButtonRef.current.getBoundingClientRect();
        setExportPopoverPosition({
          top: rect.bottom + 4,
          left: rect.right - 192, // 192px = w-48
        });
      }
    }, [showExportPopover]);

    useEffect(() => {
      if (showFilterPopover && filterButtonRef.current) {
        const rect = filterButtonRef.current.getBoundingClientRect();
        setFilterPopoverPosition({
          top: rect.bottom + 4,
          left: rect.right - 500, // 500px = w-[500px]
        });
      }
    }, [showFilterPopover]);

    useEffect(() => {
      if (showColumnPopover && columnButtonRef.current) {
        const rect = columnButtonRef.current.getBoundingClientRect();
        setColumnPopoverPosition({
          top: rect.bottom + 4,
          left: rect.right - 320, // 320px = w-80
        });
      }
    }, [showColumnPopover]);

    useEffect(() => {
      if (!showExportPopover) return;

      const handleScroll = (event: Event) => {
        // Don't close if scrolling inside the popover
        if (
          exportPopoverRef.current &&
          exportPopoverRef.current.contains(event.target as Node)
        ) {
          return;
        }
        setShowExportPopover(false);
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [showExportPopover]);

    useEffect(() => {
      if (!showFilterPopover) return;

      const handleScroll = (event: Event) => {
        // Don't close if scrolling inside the popover
        if (
          filterPopoverRef.current &&
          filterPopoverRef.current.contains(event.target as Node)
        ) {
          return;
        }
        setShowFilterPopover(false);
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [showFilterPopover]);

    useEffect(() => {
      if (!showColumnPopover) return;

      const handleScroll = (event: Event) => {
        // Don't close if scrolling inside the popover
        if (
          columnPopoverRef.current &&
          columnPopoverRef.current.contains(event.target as Node)
        ) {
          return;
        }
        setShowColumnPopover(false);
      };

      window.addEventListener('scroll', handleScroll, true);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
      };
    }, [showColumnPopover]);

    const ExportPopoverPortal = () => {
      if (!showExportPopover || typeof window === 'undefined') return null;
      return createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowExportPopover(false)}
          />
          <div
            ref={exportPopoverRef}
            className="fixed w-48 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            style={{
              top: exportPopoverPosition.top,
              left: exportPopoverPosition.left,
            }}
          >
            <div className="space-y-2">
              <div className="space-y-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    api.exportDataAsCsv();
                    setShowExportPopover(false);
                  }}
                >
                  Export as CSV
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    api.exportDataAsJson();
                    setShowExportPopover(false);
                  }}
                >
                  Export as JSON
                </Button>
              </div>
            </div>
          </div>
        </>,
        document.body
      );
    };

    const FilterPopoverPortal = () => {
      if (!showFilterPopover || typeof window === 'undefined') return null;
      return createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowFilterPopover(false)}
          />
          <div
            ref={filterPopoverRef}
            className="fixed w-[500px] p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50 overflow-visible"
            style={{
              top: filterPopoverPosition.top,
              left: filterPopoverPosition.left,
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Filters
              </h3>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {tempFilterRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center gap-2 p-3 border rounded-lg"
                >
                  <div className="min-w-[120px] flex-shrink-0">
                    <Select
                      options={columns.map((col) => ({
                        value: col.field,
                        label: col.headerName,
                      }))}
                      value={rule.field}
                      onChange={(value) => {
                        updateFilterRule(rule.id, { field: value });
                        // Apply changes immediately
                        const updatedRules = tempFilterRules.map((r) =>
                          r.id === rule.id ? { ...r, field: value } : r
                        );
                        setFilterRules(updatedRules);
                        const newFilterModel: Record<string, string> = {};
                        updatedRules.forEach((r) => {
                          if (r.operator === 'contains' && r.value) {
                            newFilterModel[r.field] = r.value;
                          }
                        });
                        setFilterModel(newFilterModel);
                        onFilterModelChange?.(updatedRules);
                      }}
                      placeholder="Select field"
                      size="sm"
                      className="z-[10001]"
                    />
                  </div>

                  <div className="min-w-[100px] flex-shrink-0">
                    <Select
                      options={[
                        { value: 'contains', label: 'Contains' },
                        { value: 'equals', label: 'Equals' },
                        { value: 'startsWith', label: 'Starts with' },
                        { value: 'endsWith', label: 'Ends with' },
                        { value: 'isEmpty', label: 'Is empty' },
                        { value: 'isNotEmpty', label: 'Is not empty' },
                      ]}
                      value={rule.operator}
                      onChange={(value) => {
                        updateFilterRule(rule.id, { operator: value as any });
                        // Apply changes immediately
                        const updatedRules = tempFilterRules.map((r) =>
                          r.id === rule.id
                            ? { ...r, operator: value as any }
                            : r
                        );
                        setFilterRules(updatedRules);
                        const newFilterModel: Record<string, string> = {};
                        updatedRules.forEach((r) => {
                          if (r.operator === 'contains' && r.value) {
                            newFilterModel[r.field] = r.value;
                          }
                        });
                        setFilterModel(newFilterModel);
                        onFilterModelChange?.(updatedRules);
                      }}
                      size="sm"
                      className="z-[10001]"
                    />
                  </div>

                  <div className="flex-1 min-w-0 fullWidth">
                    <Input
                      placeholder="Enter filter value..."
                      value={rule.value}
                      onChange={(e) => {
                        updateFilterRule(rule.id, { value: e.target.value });
                        // Apply changes immediately with debouncing
                        const updatedRules = tempFilterRules.map((r) =>
                          r.id === rule.id ? { ...r, value: e.target.value } : r
                        );
                        setFilterRules(updatedRules);
                        const newFilterModel: Record<string, string> = {};
                        updatedRules.forEach((r) => {
                          if (r.operator === 'contains' && r.value) {
                            newFilterModel[r.field] = r.value;
                          }
                        });
                        setFilterModel(newFilterModel);
                        onFilterModelChange?.(updatedRules);
                      }}
                      inputSize="sm"
                      fullWidth={true}
                    />
                  </div>

                  <div className="flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        removeFilterRule(rule.id);
                        // Apply changes immediately
                        const updatedRules = tempFilterRules.filter(
                          (r) => r.id !== rule.id
                        );
                        setFilterRules(updatedRules);
                        const newFilterModel: Record<string, string> = {};
                        updatedRules.forEach((r) => {
                          if (r.operator === 'contains' && r.value) {
                            newFilterModel[r.field] = r.value;
                          }
                        });
                        setFilterModel(newFilterModel);
                        onFilterModelChange?.(updatedRules);
                      }}
                    >
                      <X />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={addFilterRule}
                className="w-full bg-transparent"
              >
                <Plus />
                <span className="ml-2">Add Filter</span>
              </Button>
            </div>
          </div>
        </>,
        document.body
      );
    };

    const ColumnPopoverPortal = () => {
      if (!showColumnPopover || typeof window === 'undefined') return null;
      return createPortal(
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowColumnPopover(false)}
          />
          <div
            ref={columnPopoverRef}
            className="fixed w-80 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50"
            style={{
              top: columnPopoverPosition.top,
              left: columnPopoverPosition.left,
            }}
          >
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Manage Columns
              </h3>

              {/* Search input */}
              <div className="relative mb-4">
                <Input
                  startIcon={<Search className="h-4 w-4" />}
                  placeholder="Search columns..."
                  value={columnSearchQuery}
                  onChange={(e) => setColumnSearchQuery(e.target.value)}
                  className=""
                  inputSize="sm"
                  variant="default"
                />
              </div>
            </div>

            <div className="space-y-1 max-h-64 overflow-y-auto mb-4">
              {filteredColumns.map((column) => (
                <div
                  key={column.field}
                  className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    const newVisibility = {
                      ...tempColumnVisibility,
                      [column.field]: !(
                        tempColumnVisibility[column.field] ?? true
                      ),
                    };
                    setTempColumnVisibility(newVisibility);
                    // Apply changes immediately
                    setColumnVisibility(newVisibility);
                  }}
                >
                  <Checkbox
                    checked={tempColumnVisibility[column.field] ?? true}
                    onChange={(e) => {
                      e.stopPropagation();
                      const newVisibility = {
                        ...tempColumnVisibility,
                        [column.field]: e.target.checked,
                      };
                      setTempColumnVisibility(newVisibility);
                      // Apply changes immediately
                      setColumnVisibility(newVisibility);
                    }}
                  />
                  <span className="text-sm font-medium text-gray-700 flex-1">
                    {column.headerName}
                  </span>
                </div>
              ))}
            </div>

            {/* Footer with Show/Hide All toggle and Reset */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const allVisible = Object.values(tempColumnVisibility).every(
                    (visible) => visible !== false
                  );
                  if (allVisible) {
                    // Hide all
                    const allHidden = columns.reduce(
                      (acc, col) => ({ ...acc, [col.field]: false }),
                      {}
                    );
                    setTempColumnVisibility(allHidden);
                    setColumnVisibility(allHidden);
                  } else {
                    // Show all
                    const allVisible = columns.reduce(
                      (acc, col) => ({ ...acc, [col.field]: true }),
                      {}
                    );
                    setTempColumnVisibility(allVisible);
                    setColumnVisibility(allVisible);
                  }
                }}
              >
                {Object.values(tempColumnVisibility).every(
                  (visible) => visible !== false
                )
                  ? 'Hide All'
                  : 'Show All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const defaultVisibility = columns.reduce(
                    (acc, col) => ({ ...acc, [col.field]: true }),
                    {}
                  );
                  setTempColumnVisibility(defaultVisibility);
                  setColumnVisibility(defaultVisibility);
                  setColumnSearchQuery('');
                }}
              >
                Reset
              </Button>
            </div>
          </div>
        </>,
        document.body
      );
    };

    const handleCellDoubleClick = (
      rowId: string | number,
      field: string,
      currentValue: any
    ) => {
      if (!isEditable) return;
      setEditingCell({ rowId, field });
      setEditValue(String(currentValue || ''));
    };

    const handleEditSave = () => {
      if (!editingCell) return;

      const updatedRows = rows.map((row) => {
        if (row.id === editingCell.rowId) {
          return { ...row, [editingCell.field]: editValue };
        }
        return row;
      });

      setRows(updatedRows);

      onCellValueChange?.({
        id: editingCell.rowId,
        field: editingCell.field,
        value: editValue,
      });

      onRowsChange?.(updatedRows);

      setEditingCell(null);
      setEditValue('');
    };

    const handleEditCancel = () => {
      setEditingCell(null);
      setEditValue('');
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

    const renderCell = (row: any, column: Column) => {
      const value = column.valueGetter
        ? column.valueGetter({
            id: row[idField],
            row,
            field: column.field,
            value: row[column.field],
            colDef: column,
            api,
          })
        : row[column.field];

      const isCellEditable =
        isEditable && column.editable !== false && !column.valueGetter;
      const isCurrentlyEditing =
        editingCell?.rowId === row.id && editingCell?.field === column.field;

      if (isCurrentlyEditing) {
        return (
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const newRows = rows.map((r) =>
                  r.id === row.id ? { ...r, [column.field]: editValue } : r
                );
                setRows(newRows);
                onCellValueChange?.({
                  id: row.id,
                  field: column.field,
                  value: editValue,
                });
                onRowsChange?.(newRows);
                setEditingCell(null);
                setEditValue('');
              } else if (e.key === 'Escape') {
                setEditingCell(null);
                setEditValue('');
              }
            }}
            onBlur={() => {
              const newRows = rows.map((r) =>
                r.id === row.id ? { ...r, [column.field]: editValue } : r
              );
              setRows(newRows);
              onCellValueChange?.({
                id: row.id,
                field: column.field,
                value: editValue,
              });
              onRowsChange?.(newRows);
              setEditingCell(null);
              setEditValue('');
            }}
            className="w-full h-full px-2 py-1 border-2 border-blue-500 rounded focus:outline-none"
            autoFocus
          />
        );
      }

      if (column.renderCell) {
        return column.renderCell({
          id: row[idField],
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
              setEditingCell({ rowId: row.id, field: column.field });
              setEditValue(String(value || ''));
            }
          }}
        >
          {String(value || '')}
        </div>
      );
    };

    const handleRowClick = (row: any, event: React.MouseEvent) => {
      if (!checkboxSelectionOnRowClick || !checkboxSelection) return;

      // Don't trigger if clicking on checkbox, button, or input elements
      const target = event.target as HTMLElement;
      if (
        (target instanceof HTMLInputElement && target.type === 'checkbox') ||
        target instanceof HTMLButtonElement ||
        target instanceof HTMLInputElement
      ) {
        return;
      }

      const rowId = String(row.id);
      const newSelection = selectedRows.includes(rowId)
        ? selectedRows.filter((id) => id !== rowId)
        : [...selectedRows, rowId];

      setSelectedRows(newSelection);
      onSelectionModelChange?.(newSelection);
    };

    return (
      <div className={cn('border rounded-lg bg-white', className)}>
        {/* Toolbar */}
        {!hideToolbar && (
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              {!hideSearch && (
                <div className="relative hidden md:block">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      startIcon={<Search className="h-5 w-5" />}
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-64 pl-9"
                      variant="default"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!hideExport && (
                <div className="relative">
                  <Button
                    ref={exportButtonRef}
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportPopover(!showExportPopover)}
                  >
                    <Download className="h-4 w-4" />
                    {!hideExportLabel && (
                      <span className="ml-2 hidden md:inline">Export</span>
                    )}
                  </Button>
                  <ExportPopoverPortal />
                </div>
              )}

              {!hideFilters && (
                <div className="relative">
                  <Button
                    ref={filterButtonRef}
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilterPopover(!showFilterPopover)}
                  >
                    <Filter className="h-4 w-4" />
                    {!hideFilterLabel && (
                      <span className="ml-2 hidden md:inline">Filters</span>
                    )}
                  </Button>
                  <FilterPopoverPortal />
                </div>
              )}

              {!hideColumns && (
                <div className="relative">
                  <Button
                    ref={columnButtonRef}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTempColumnVisibility({ ...columnVisibility });
                      setShowColumnPopover(!showColumnPopover);
                    }}
                  >
                    <Settings className="h-4 w-4" />
                    {!hideColumnsLabel && (
                      <span className="ml-2 hidden md:inline">Columns</span>
                    )}
                  </Button>
                  <ColumnPopoverPortal />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table
            className={`w-full ${getDensityClasses()}`}
            style={{ minWidth: 'max-content' }}
          >
            <thead className="bg-gray-50 border-b-2">
              <tr>
                {checkboxSelection &&
                  orderedColumns.filter((col) => columnVisibility[col.field])
                    .length > 0 && (
                    <th
                      className={`w-12 ${getHeaderPadding()} text-center border-r last:border-r-0`}
                    >
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={
                            paginatedRows.length > 0 &&
                            paginatedRows.every((row) =>
                              selectedRows.includes(String(row.id))
                            )
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                        />
                      </div>
                    </th>
                  )}
                {orderedColumns
                  .filter((col) => columnVisibility[col.field])
                  .map((column) => (
                    <th
                      key={column.field}
                      className={`${getHeaderPadding()} text-left font-medium border-r last:border-r-0 relative group ${
                        isDragging === column.field ? 'opacity-50' : ''
                      }`}
                      style={{
                        width:
                          columnWidths[column.field] || column.width || 150,
                      }}
                      onDragOver={
                        enableColumnReorder ? handleDragOver : undefined
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
                              enableColumnReorder ? handleDragEnd : undefined
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
                              ) : sortModel.find(
                                  (s) => s.field === column.field
                                )?.sort === 'desc' ? (
                                <ChevronDown />
                              ) : (
                                <ChevronUp />
                              )}
                            </button>
                          )}
                        </div>

                        {/* Column Resize Handle */}
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 opacity-0 hover:opacity-100 transition-opacity"
                          onMouseDown={(e) =>
                            handleResizeStart(e, column.field)
                          }
                        />
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {/* Column Filters Row */}
              {enableColumnFilters && (
                <tr className="bg-gray-50 border-b">
                  {checkboxSelection &&
                    orderedColumns.filter((col) => columnVisibility[col.field])
                      .length > 0 && <td className="w-12 p-2 border-r"></td>}
                  {orderedColumns
                    .filter((col) => columnVisibility[col.field])
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
                            setFilterModel((prev) => ({
                              ...prev,
                              [column.field]: newValue,
                            }));

                            // Sync with filter rules
                            setFilterRules((prevRules) => {
                              const existingRuleIndex = prevRules.findIndex(
                                (rule) =>
                                  rule.field === column.field &&
                                  rule.operator === 'contains'
                              );

                              if (newValue) {
                                if (existingRuleIndex >= 0) {
                                  // Update existing rule
                                  const newRules = [...prevRules];
                                  newRules[existingRuleIndex] = {
                                    ...newRules[existingRuleIndex],
                                    value: newValue,
                                  };
                                  return newRules;
                                } else {
                                  // Add new rule
                                  return [
                                    ...prevRules,
                                    {
                                      id: Math.random()
                                        .toString(36)
                                        .substr(2, 9),
                                      field: column.field,
                                      operator: 'contains',
                                      value: newValue,
                                    },
                                  ];
                                }
                              } else {
                                // Remove rule if value is empty
                                if (existingRuleIndex >= 0) {
                                  return prevRules.filter(
                                    (_, index) => index !== existingRuleIndex
                                  );
                                }
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
              {orderedColumns.filter((col) => columnVisibility[col.field])
                .length === 0 ? (
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
                        (col) => columnVisibility[col.field]
                      ).length +
                      (checkboxSelection &&
                      orderedColumns.filter(
                        (col) => columnVisibility[col.field]
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
                paginatedRows.map((row, index) => (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-200 hover:bg-gray-50 ${
                      selectedRows.includes(String(row.id)) ? 'bg-blue-50' : ''
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
                        (col) => columnVisibility[col.field]
                      ).length > 0 && (
                        <td
                          className={`${getCellPadding()} ${
                            !hideGridLines ? 'border-r' : ''
                          } text-center`}
                        >
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedRows.includes(String(row.id))}
                              onChange={(e) =>
                                handleRowSelection(row.id, e.target.checked)
                              }
                            />
                          </div>
                        </td>
                      )}
                    {orderedColumns
                      .filter((col) => columnVisibility[col.field])
                      .map((column) => (
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
                          }`}
                          style={{
                            width:
                              columnWidths[column.field] || column.width || 150,
                          }}
                        >
                          {renderCell(row, column)}
                        </td>
                      ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!hideFooter && (
          <div className="flex items-center justify-center md:justify-between p-4 border-t">
            {!hideRowsPerPage && (
              <div className="items-center gap-3 hidden md:flex">
                <span className="text-sm text-gray-500 whitespace-nowrap">
                  Rows per page:
                </span>
                <div className="min-w-[80px]">
                  <Select
                    options={pageSizeOptions.map((size) => ({
                      value: size.toString(),
                      label: size.toString(),
                    }))}
                    value={currentPageSize.toString()}
                    onChange={(value) => {
                      setCurrentPageSize(Number(value));
                      setPage(0);
                    }}
                    size="sm"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {sortedRows.length === 0
                  ? '0'
                  : `${page * currentPageSize + 1}-${Math.min(
                      (page + 1) * currentPageSize,
                      sortedRows.length
                    )} of ${sortedRows.length}`}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(0)}
                  disabled={page === 0}
                >
                  <ChevronsLeft />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 0}
                >
                  <ChevronLeft />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronRight />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(totalPages - 1)}
                  disabled={page >= totalPages - 1}
                >
                  <ChevronsRight />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

DataGrid.displayName = 'DataGrid';

export { DataGrid };
export default DataGrid;
