'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Input } from '../../ui/Input/Input';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Button } from '../../ui/Button/Button';
import { Search } from 'lucide-react';
import type { Column } from '../../../types';

interface ColumnPopoverPortalProps {
  show: boolean;
  onClose: () => void;
  columnPopoverRef: React.RefObject<HTMLDivElement>;
  position: { top: number; left: number };
  columnSearchQuery: string;
  setColumnSearchQuery: (value: string) => void;
  filteredColumns: Column[];
  tempColumnVisibility: Record<string, boolean>;
  setTempColumnVisibility: (visibility: Record<string, boolean>) => void;
  setColumnVisibility: (visibility: Record<string, boolean>) => void;
  columns: Column[];
}

const ColumnPopoverPortal: React.FC<ColumnPopoverPortalProps> = ({
  show,
  onClose,
  columnPopoverRef,
  position,
  columnSearchQuery,
  setColumnSearchQuery,
  filteredColumns,
  tempColumnVisibility,
  setTempColumnVisibility,
  setColumnVisibility,
  columns,
}) => {
  if (!show || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => onClose()}
      />
      <div
        ref={columnPopoverRef}
        className="fixed w-80 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50"
        style={{ top: position.top, left: position.left }}
      >
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Manage Columns
          </h3>

          <div className="relative mb-4">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Search columns..."
              value={columnSearchQuery}
              onChange={(e) => setColumnSearchQuery(e.target.value)}
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
                  [column.field]: !(tempColumnVisibility[column.field] ?? true),
                };
                setTempColumnVisibility(newVisibility);
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
                  setColumnVisibility(newVisibility);
                }}
              />
              <span className="text-sm font-medium text-gray-700 flex-1">
                {column.headerName}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const allVisible = Object.values(tempColumnVisibility).every(
                (visible) => visible !== false
              );
              if (allVisible) {
                const allHidden = columns.reduce(
                  (acc, col) => ({ ...acc, [col.field]: false }),
                  {}
                );
                setTempColumnVisibility(allHidden);
                setColumnVisibility(allHidden);
              } else {
                const allVisibleModel = columns.reduce(
                  (acc, col) => ({ ...acc, [col.field]: true }),
                  {}
                );
                setTempColumnVisibility(allVisibleModel);
                setColumnVisibility(allVisibleModel);
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
    document.body as HTMLElement
  );
};

export default ColumnPopoverPortal;
