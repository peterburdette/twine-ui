'use client';

import React from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Download, Filter as FilterIcon, Search, Settings } from 'lucide-react';
import FilterPopoverPortal from './FilterPopoverPortal';
import ColumnPopoverPortal from './ColumnPopoverPortal';
import ExportPopoverPortal from './ExportPopoverPortal';
import type { FilterRule, Column } from '../../../types';

interface DataGridToolbarProps {
  className?: string;
  // visibility flags
  hideSearch: boolean;
  hideFilters: boolean;
  hideExport: boolean;
  hideColumns: boolean;
  hideFilterLabel: boolean;
  hideExportLabel: boolean;
  hideColumnsLabel: boolean;

  // search
  searchQuery: string;
  onSearchChange: (v: string) => void;

  // badge
  badgeCount: number;

  // filter popover wiring
  showFilterPopover: boolean;
  setShowFilterPopover: (v: boolean) => void;
  filterButtonRef: React.RefObject<HTMLButtonElement>;
  filterPopoverRef: React.RefObject<HTMLDivElement>;
  filterPopoverPosition: { top: number; left: number };

  tempFilterRules: FilterRule[];
  committedFilters: FilterRule[];
  onChangeFilterValue: (id: string, v: string) => void;
  onChangeFilterField: (id: string, field: string) => void;
  onChangeFilterOperator: (id: string, op: string) => void;
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  onClearTempFilters: () => void;
  setFilterRules: (rules: FilterRule[]) => void;
  setFilterModel: (model: Record<string, string>) => void;
  onFilterModelChange?: (rules: FilterRule[]) => void;
  availableFields: Array<{ field: string; label: string }>;

  // export popover wiring
  showExportPopover: boolean;
  setShowExportPopover: (v: boolean) => void;
  exportButtonRef: React.RefObject<HTMLButtonElement>;
  exportPopoverRef: React.RefObject<HTMLDivElement>;
  exportPopoverPosition: { top: number; left: number };
  onExportCsv: () => void;
  onExportJson: () => void;

  // columns popover wiring
  showColumnPopover: boolean;
  setShowColumnPopover: (v: boolean) => void;
  columnButtonRef: React.RefObject<HTMLButtonElement>;
  columnPopoverRef: React.RefObject<HTMLDivElement>;
  columnPopoverPosition: { top: number; left: number };
  columnSearchQuery: string;
  setColumnSearchQuery: (v: string) => void;
  filteredColumns: Column[];
  tempColumnVisibility: Record<string, boolean>;
  setTempColumnVisibility: (v: Record<string, boolean>) => void;
  setColumnVisibility: (v: Record<string, boolean>) => void;
  columns: Column[];
}

const DataGridToolbar: React.FC<DataGridToolbarProps> = (props) => {
  const {
    className,
    hideSearch,
    hideFilters,
    hideExport,
    hideColumns,
    hideFilterLabel,
    hideExportLabel,
    hideColumnsLabel,
    searchQuery,
    onSearchChange,
    badgeCount,
    showFilterPopover,
    setShowFilterPopover,
    filterButtonRef,
    filterPopoverRef,
    filterPopoverPosition,
    tempFilterRules,
    committedFilters,
    onChangeFilterValue,
    onChangeFilterField,
    onChangeFilterOperator,
    onAddFilter,
    onRemoveFilter,
    onClearTempFilters,
    setFilterRules,
    setFilterModel,
    onFilterModelChange,
    availableFields,
    showExportPopover,
    setShowExportPopover,
    exportButtonRef,
    exportPopoverRef,
    exportPopoverPosition,
    onExportCsv,
    onExportJson,
    showColumnPopover,
    setShowColumnPopover,
    columnButtonRef,
    columnPopoverRef,
    columnPopoverPosition,
    columnSearchQuery,
    setColumnSearchQuery,
    filteredColumns,
    tempColumnVisibility,
    setTempColumnVisibility,
    setColumnVisibility,
    columns,
  } = props;

  return (
    <div
      className={`flex items-center justify-between p-4 border-b ${
        className ?? ''
      }`}
    >
      <div className="flex items-center gap-2">
        {!hideSearch && (
          <div className="relative hidden md:block">
            <div className="relative">
              <Input
                startIcon={<Search className="h-5 w-5" />}
                placeholder="Search…"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-64"
                variant="default"
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {!hideFilters && (
          <div className="relative">
            <Button
              ref={filterButtonRef}
              variant="outline"
              size="sm"
              onClick={() => setShowFilterPopover(!showFilterPopover)}
              className="relative"
            >
              <FilterIcon className="h-4 w-4" />
              {!hideFilterLabel && (
                <span className="ml-2 hidden md:inline">Filters</span>
              )}
              {badgeCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {badgeCount}
                </span>
              )}
            </Button>

            <FilterPopoverPortal
              show={showFilterPopover}
              onClose={() => setShowFilterPopover(false)}
              popoverRef={filterPopoverRef}
              position={filterPopoverPosition}
              filters={tempFilterRules}
              onChangeFilterValue={onChangeFilterValue}
              onChangeFilterField={onChangeFilterField}
              onChangeFilterOperator={onChangeFilterOperator}
              onAddFilter={onAddFilter}
              onRemoveFilter={onRemoveFilter}
              availableFields={availableFields}
              availableOperators={[
                { value: 'contains', label: 'Contains' },
                { value: 'equals', label: 'Equals' },
                { value: 'startsWith', label: 'Starts with' },
                { value: 'endsWith', label: 'Ends with' },
                { value: 'isEmpty', label: 'Is empty' },
                { value: 'isNotEmpty', label: 'Is not empty' },
              ]}
              committedFilters={committedFilters}
              onClearTempFilters={onClearTempFilters}
              setFilterRules={setFilterRules}
              setFilterModel={setFilterModel}
              onFilterModelChange={onFilterModelChange}
            />
          </div>
        )}

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
            <ExportPopoverPortal
              show={showExportPopover}
              onClose={() => setShowExportPopover(false)}
              popoverRef={exportPopoverRef}
              position={exportPopoverPosition}
              onExportCsv={onExportCsv}
              onExportJson={onExportJson}
            />
          </div>
        )}

        {!hideColumns && (
          <div className="relative">
            <Button
              ref={columnButtonRef}
              variant="outline"
              size="sm"
              onClick={() => {
                setTempColumnVisibility({ ...tempColumnVisibility });
                setShowColumnPopover(!showColumnPopover);
              }}
            >
              <Settings className="h-4 w-4" />
              {!hideColumnsLabel && (
                <span className="ml-2 hidden md:inline">Columns</span>
              )}
            </Button>
            <ColumnPopoverPortal
              show={showColumnPopover}
              onClose={() => setShowColumnPopover(false)}
              columnPopoverRef={columnPopoverRef}
              position={columnPopoverPosition}
              columnSearchQuery={columnSearchQuery}
              setColumnSearchQuery={setColumnSearchQuery}
              filteredColumns={filteredColumns}
              tempColumnVisibility={tempColumnVisibility}
              setTempColumnVisibility={setTempColumnVisibility}
              setColumnVisibility={setColumnVisibility}
              columns={columns}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default DataGridToolbar;
