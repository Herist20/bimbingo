'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LecturerForm } from './lecturer-form';
import { searchLecturers, type LecturerRow } from '@/lib/actions/lecturers';
import { cn } from '@/lib/utils';

interface LecturerComboboxProps {
  value?: string | null;
  onChange: (lecturer: LecturerRow | null) => void;
  placeholder?: string;
  initialOption?: LecturerRow | null;
  disabled?: boolean;
}

export function LecturerCombobox({
  value,
  onChange,
  placeholder = 'Pilih dosen…',
  initialOption,
  disabled,
}: LecturerComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<LecturerRow[]>(initialOption ? [initialOption] : []);
  const [loading, setLoading] = React.useState(false);

  const selected = React.useMemo(
    () => items.find((l) => l.id === value) ?? null,
    [items, value],
  );

  // debounce search
  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = window.setTimeout(async () => {
      const result = await searchLecturers(query);
      if (result.ok) {
        setItems(result.data);
      } else {
        toast.error(result.error.message);
      }
      setLoading(false);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="secondary"
            disabled={disabled}
            className="w-full justify-between font-normal"
            aria-expanded={open}
          >
            <span className={cn('truncate', !selected && 'text-[var(--text-muted)]')}>
              {selected
                ? selected.title
                  ? `${selected.title} ${selected.full_name}`
                  : selected.full_name
                : placeholder}
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              value={query}
              onValueChange={setQuery}
              placeholder="Cari nama atau kampus…"
            />
            <CommandList>
              {loading ? (
                <CommandEmpty>Mencari…</CommandEmpty>
              ) : items.length === 0 ? (
                <CommandEmpty>Tidak ada hasil.</CommandEmpty>
              ) : (
                <CommandGroup>
                  {items.map((l) => (
                    <CommandItem
                      key={l.id}
                      value={l.id}
                      onSelect={() => {
                        onChange(l);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          'h-4 w-4',
                          selected?.id === l.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {l.title ? `${l.title} ${l.full_name}` : l.full_name}
                        </span>
                        {l.university ? (
                          <span className="text-xs text-[var(--text-muted)]">
                            {l.university}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  value="__create__"
                  onSelect={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Tambah dosen baru
                </CommandItem>
                {selected ? (
                  <CommandItem
                    value="__clear__"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                  >
                    Bersihkan pilihan
                  </CommandItem>
                ) : null}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <DialogPrimitive.Root open={createOpen} onOpenChange={setCreateOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-6 shadow-xl">
            <div className="flex flex-col gap-1">
              <DialogPrimitive.Title className="text-lg font-semibold">
                Tambah dosen
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className="text-sm text-[var(--text-secondary)]">
                Setelah disimpan, dosen otomatis terpilih di combobox.
              </DialogPrimitive.Description>
            </div>
            <div className="mt-4">
              <LecturerForm
                mode="create"
                hideCancel
                onCreated={async ({ id }) => {
                  const result = await searchLecturers(id);
                  if (result.ok) {
                    const created = result.data.find((l) => l.id === id);
                    if (created) {
                      setItems((prev) => [created, ...prev.filter((p) => p.id !== id)]);
                      onChange(created);
                    }
                  }
                  setCreateOpen(false);
                }}
              />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
