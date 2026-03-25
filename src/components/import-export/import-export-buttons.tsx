"use client";

import { useState, useRef } from "react";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportDialog } from "./import-dialog";

interface ImportExportButtonsProps {
  entity: string;
  entityLabel: string;
  onImportComplete?: () => void;
}

export function ImportExportButtons({
  entity,
  entityLabel,
  onImportComplete,
}: ImportExportButtonsProps) {
  const [importOpen, setImportOpen] = useState(false);
  const linkRef = useRef<HTMLAnchorElement>(null);

  const handleExport = () => {
    const link = linkRef.current;
    if (link) {
      link.href = `/api/data/${entity}/export`;
      link.click();
    }
  };

  const handleTemplate = () => {
    const link = linkRef.current;
    if (link) {
      link.href = `/api/data/${entity}/template`;
      link.click();
    }
  };

  return (
    <>
      <a ref={linkRef} className="hidden" download />
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTemplate}
          className="gap-1.5 rounded-xl border-border-subtle text-[13px] text-text-secondary hover:text-text-primary"
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Template
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          className="gap-1.5 rounded-xl border-border-subtle text-[13px] text-text-secondary hover:text-text-primary"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setImportOpen(true)}
          className="gap-1.5 rounded-xl border-border-subtle text-[13px] text-text-secondary hover:text-text-primary"
        >
          <Upload className="h-3.5 w-3.5" />
          Import
        </Button>
      </div>

      <ImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        entity={entity}
        entityLabel={entityLabel}
        onImportComplete={onImportComplete}
      />
    </>
  );
}
