'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { FieldEditor } from './field-editor';
import type { CFEntityType, CustomFieldRow } from '@/lib/schemas/custom-field';

interface AddFieldButtonProps {
  entityType: CFEntityType;
  label?: string;
  onSaved?: (field: CustomFieldRow) => void;
}

export function AddFieldButton({
  entityType,
  label = 'Tambah field kustom',
  onSaved,
}: AddFieldButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        {label}
      </Button>
      <FieldEditor
        entityType={entityType}
        open={open}
        onOpenChange={setOpen}
        onSaved={(f) => {
          setOpen(false);
          if (onSaved) onSaved(f);
          else router.refresh();
        }}
      />
    </>
  );
}
