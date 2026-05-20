'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { searchClients, type ClientRow } from '@/lib/actions/clients';
import { cn } from '@/lib/utils';

interface ClientComboboxProps {
  value?: string | null;
  onChange: (client: ClientRow | null) => void;
  placeholder?: string;
  initialOption?: ClientRow | null;
  disabled?: boolean;
}

export function ClientCombobox({
  value,
  onChange,
  placeholder = 'Pilih klien…',
  initialOption,
  disabled,
}: ClientComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [items, setItems] = React.useState<ClientRow[]>(initialOption ? [initialOption] : []);
  const [loading, setLoading] = React.useState(false);

  const selected = React.useMemo(
    () => items.find((c) => c.id === value) ?? null,
    [items, value],
  );

  React.useEffect(() => {
    if (!open) return;
    setLoading(true);
    const handle = window.setTimeout(async () => {
      const result = await searchClients(query);
      if (result.ok) setItems(result.data);
      else toast.error(result.error.message);
      setLoading(false);
    }, 200);
    return () => window.clearTimeout(handle);
  }, [query, open]);

  return (
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
            {selected ? selected.full_name : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder="Cari nama / WA / kampus…"
          />
          <CommandList>
            {loading ? (
              <CommandEmpty>Mencari…</CommandEmpty>
            ) : items.length === 0 ? (
              <CommandEmpty>Tidak ada klien aktif.</CommandEmpty>
            ) : (
              <CommandGroup>
                {items.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.id}
                    onSelect={() => {
                      onChange(c);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        'h-4 w-4',
                        selected?.id === c.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <div className="flex flex-col">
                      <span className="text-sm">{c.full_name}</span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {c.university ?? c.whatsapp}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
