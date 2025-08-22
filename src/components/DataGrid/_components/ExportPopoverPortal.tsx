'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '../../ui/Button/Button';

interface ExportPopoverPortalProps {
  show: boolean;
  onClose: () => void;
  popoverRef: React.RefObject<HTMLDivElement>;
  position: { top: number; left: number };
  onExportCsv: () => void;
  onExportJson: () => void;
}

const ExportPopoverPortal: React.FC<ExportPopoverPortalProps> = ({
  show,
  onClose,
  popoverRef,
  position,
  onExportCsv,
  onExportJson,
}) => {
  if (!show || typeof window === 'undefined') return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      <div
        ref={popoverRef}
        className="fixed w-48 p-4 bg-white border border-gray-200 rounded-md shadow-lg z-50"
        style={{ top: position.top, left: position.left }}
      >
        <div className="space-y-2">
          <div className="space-y-1">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onExportCsv();
                onClose();
              }}
            >
              Export as CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => {
                onExportJson();
                onClose();
              }}
            >
              Export as JSON
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body as HTMLElement
  );
};

export default ExportPopoverPortal;
