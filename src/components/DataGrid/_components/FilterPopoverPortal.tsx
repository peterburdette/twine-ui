'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Input } from '../../ui/Input/Input';
import { Select } from '../../ui/Select/Select';
import { Button } from '../../ui/Button/Button';
import { X, Filter as FilterIcon } from 'lucide-react';
import type { FilterRule } from '../../../types';

interface FilterPopoverPortalProps {
  show: boolean;
  onClose: () => void;
  popoverRef: React.RefObject<HTMLDivElement>;
  position: { top: number; left: number };

  filters: FilterRule[];
  onChangeFilterValue: (id: string, value: string) => void;
  onChangeFilterField: (id: string, field: string) => void;
  onChangeFilterOperator: (id: string, op: string) => void;
  onAddFilter: () => void;
  onRemoveFilter: (id: string) => void;
  availableFields: Array<{ field: string; label: string }>;
  availableOperators: Array<{ value: string; label: string }>;

  committedFilters: FilterRule[];
  onClearTempFilters: () => void;

  setFilterRules: (rules: FilterRule[]) => void;
  setFilterModel: (model: Record<string, string>) => void;
  onFilterModelChange?: (rules: FilterRule[]) => void;
}

const FilterPopoverPortal: React.FC<FilterPopoverPortalProps> = ({
  show,
  onClose,
  popoverRef,
  position,
  filters,
  onChangeFilterValue,
  onChangeFilterField,
  onChangeFilterOperator,
  onAddFilter,
  onRemoveFilter,
  availableFields,
  availableOperators,
  committedFilters,
  onClearTempFilters,
  setFilterRules,
  setFilterModel,
  onFilterModelChange,
}) => {
  if (!show || typeof window === 'undefined') return null;

  const normalize = (arr: FilterRule[]) =>
    [...arr]
      .map((r) => ({
        field: r.field,
        operator: r.operator,
        value: String(r.value ?? ''),
      }))
      .sort((a, b) =>
        (a.field + a.operator + a.value).localeCompare(
          b.field + b.operator + b.value
        )
      );

  const hasFilters = filters.length > 0;
  const a = normalize(filters);
  const b = normalize(committedFilters);
  const isEqual =
    a.length === b.length &&
    a.every(
      (v, i) =>
        v.field === b[i].field &&
        v.operator === b[i].operator &&
        v.value === b[i].value
    );

  const canClear = hasFilters;
  const canApply = hasFilters || !isEqual;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      />
      <div
        ref={popoverRef}
        className="fixed w-[28rem] p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50"
        style={{ top: position.top, left: position.left }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Filters</h3>
        </div>

        <div className="space-y-3 max-h-72 overflow-auto pr-1">
          {filters.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-gray-500 py-12 text-center">
              <FilterIcon className="h-8 w-8 mb-2" />
              <div className="text-base font-medium">No filters applied</div>
              <div className="text-sm">
                Click &quot;Add Filter&quot; to get started
              </div>
            </div>
          ) : (
            filters.map((f) => (
              <div
                key={f.id}
                className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center"
              >
                <Select
                  options={availableFields.map((opt) => ({
                    value: opt.field,
                    label: opt.label,
                  }))}
                  value={f.field}
                  onChange={(value) => onChangeFilterField(f.id, value)}
                  size="sm"
                  variant="default"
                  fullWidth
                />

                <Select
                  options={availableOperators}
                  value={f.operator}
                  onChange={(value) => onChangeFilterOperator(f.id, value)}
                  size="sm"
                  variant="default"
                  fullWidth
                />

                <Input
                  placeholder="Enter filter value..."
                  value={f.value ?? ''}
                  onChange={(e) => onChangeFilterValue(f.id, e.target.value)}
                  inputSize="sm"
                  fullWidth
                  variant="default"
                />

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemoveFilter(f.id)}
                  className="flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 mt-3 border-t flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={onAddFilter}
          >
            Add Filter
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!canClear}
              onClick={() => onClearTempFilters()}
            >
              Clear
            </Button>
            <Button
              size="sm"
              disabled={!canApply}
              onClick={() => {
                setFilterRules(filters);
                const newFilterModel: Record<string, string> = {};
                filters.forEach((r) => {
                  if (r.operator === 'contains' && r.value) {
                    newFilterModel[r.field] = String(r.value);
                  }
                });
                setFilterModel(newFilterModel);
                onFilterModelChange?.(filters);
                onClose();
              }}
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body as HTMLElement
  );
};

export default FilterPopoverPortal;
