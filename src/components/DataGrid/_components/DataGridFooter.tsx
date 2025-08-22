'use client';

import React from 'react';
import { Button } from '../../ui/Button/Button';
import { Select } from '../../ui/Select/Select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface DataGridFooterProps {
  hideRowsPerPage: boolean;
  pageSizeOptions: number[];
  currentPageSize: number;
  onPageSizeChange: (n: number) => void;

  page: number;
  totalPages: number;
  onPageChange: (n: number) => void;

  sortedRowsLength: number;
  className?: string;
}

const DataGridFooter: React.FC<DataGridFooterProps> = ({
  hideRowsPerPage,
  pageSizeOptions,
  currentPageSize,
  onPageSizeChange,
  page,
  totalPages,
  onPageChange,
  sortedRowsLength,
  className,
}) => {
  return (
    <div
      className={`flex items-center justify-center p-4 border-t ${
        !hideRowsPerPage ? 'md:justify-between' : 'md:justify-end'
      } ${className ?? ''}`}
    >
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
              onChange={(value) => onPageSizeChange(Number(value))}
              size="sm"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {sortedRowsLength === 0
            ? '0'
            : `${page * currentPageSize + 1}-${Math.min(
                (page + 1) * currentPageSize,
                sortedRowsLength
              )} of ${sortedRowsLength}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(0)}
            disabled={page === 0}
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DataGridFooter;
