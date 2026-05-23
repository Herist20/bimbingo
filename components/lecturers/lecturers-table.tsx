'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, SortingState } from '@tanstack/react-table';
import { MoreHorizontal, PencilLine, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ColumnManager, type BuiltinColumnSpec } from '@/components/custom-fields/column-manager';
import { CustomFieldCell } from '@/components/custom-fields/custom-field-cell';
import { useColumnVisibility } from '@/hooks/use-column-visibility';
import { bulkDeleteLecturers, deleteLecturer, type LecturerRow } from '@/lib/actions/lecturers';
import type { CustomFieldRow } from '@/lib/schemas/custom-field';
import { cn } from '@/lib/utils';

interface LecturersTableProps {
  data: LecturerRow[];
  customFields?: CustomFieldRow[];
}

const BUILTIN_COLUMNS: BuiltinColumnSpec[] = [
  { key: 'full_name', label: 'Nama', toggleable: false },
  { key: 'university', label: 'Kampus' },
  { key: 'faculty', label: 'Fakultas' },
  { key: 'tags', label: 'Tag' },
];

const BUILTIN_DEFAULTS: Record<string, boolean> = Object.fromEntries(
  BUILTIN_COLUMNS.map((c) => [c.key, true]),
);

export function LecturersTable({ data, customFields: initialCustomFields = [] }: LecturersTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'full_name', desc: false },
  ]);
  const [pending, startTransition] = React.useTransition();
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);
  const [customFields, setCustomFields] = React.useState<CustomFieldRow[]>(initialCustomFields);
  const [rowSelection, setRowSelection] = React.useState<Record<string, boolean>>({});
  const [bulkConfirming, setBulkConfirming] = React.useState(false);

  React.useEffect(() => setCustomFields(initialCustomFields), [initialCustomFields]);

  const defaultVisibility = React.useMemo(() => {
    const map = { ...BUILTIN_DEFAULTS };
    for (const f of customFields) {
      if (!f.archived_at) map[`cf:${f.key}`] = f.show_in_list;
    }
    return map;
  }, [customFields]);

  const { visible: columnVisibility, toggle: toggleColumn } = useColumnVisibility(
    'lecturers',
    defaultVisibility,
  );

  const handleDelete = React.useCallback(
    (row: LecturerRow) => {
      if (confirmingId !== row.id) {
        setConfirmingId(row.id);
        toast.warning(`Hapus ${row.full_name}? Klik sekali lagi untuk konfirmasi.`);
        window.setTimeout(() => setConfirmingId(null), 4000);
        return;
      }
      startTransition(async () => {
        const result = await deleteLecturer(row.id);
        setConfirmingId(null);
        if (!result.ok) {
          toast.error(result.error.message);
          return;
        }
        toast.success('Dosen dihapus.');
      });
    },
    [confirmingId, startTransition],
  );

  const columns = React.useMemo<ColumnDef<LecturerRow>[]>(() => {
    const cols: ColumnDef<LecturerRow>[] = [];

    cols.push({
      id: '_select',
      header: ({ table }) => (
        <input
          type="checkbox"
          aria-label="Pilih semua di halaman ini"
          checked={table.getIsAllPageRowsSelected()}
          ref={(el) => {
            if (el) el.indeterminate = table.getIsSomePageRowsSelected();
          }}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          className="h-4 w-4 accent-[var(--brand)]"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          aria-label={`Pilih ${row.original.full_name}`}
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 accent-[var(--brand)]"
        />
      ),
      enableSorting: false,
    });

    if (columnVisibility.full_name !== false) {
      cols.push({
        id: 'full_name',
        accessorKey: 'full_name',
        header: 'Nama',
        cell: ({ row }) => (
          <div className="flex flex-col">
            <Link
              href={`/lecturers/${row.original.id}`}
              className="text-sm font-medium text-[var(--text-primary)] hover:underline"
            >
              {row.original.title ? `${row.original.title} ${row.original.full_name}` : row.original.full_name}
            </Link>
            {row.original.email ? (
              <span className="text-xs text-[var(--text-muted)]">{row.original.email}</span>
            ) : null}
          </div>
        ),
      });
    }

    if (columnVisibility.university !== false) {
      cols.push({
        id: 'university',
        accessorKey: 'university',
        header: 'Kampus',
        cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? '—'}</span>,
      });
    }

    if (columnVisibility.faculty !== false) {
      cols.push({
        id: 'faculty',
        accessorKey: 'faculty',
        header: 'Fakultas',
        cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? '—'}</span>,
      });
    }

    if (columnVisibility.tags !== false) {
      cols.push({
        id: 'tags',
        accessorKey: 'tags',
        header: 'Tag',
        cell: ({ getValue }) => {
          const tags = (getValue<string[]>() ?? []).slice(0, 3);
          if (tags.length === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;
          return (
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <Badge key={t} tone="neutral">
                  {t}
                </Badge>
              ))}
            </div>
          );
        },
      });
    }

    for (const f of customFields) {
      if (f.archived_at) continue;
      const colKey = `cf:${f.key}`;
      if (columnVisibility[colKey] === false) continue;
      cols.push({
        id: colKey,
        header: f.label,
        cell: ({ row }) => (
          <CustomFieldCell field={f} value={row.original.custom_data?.[f.key]} />
        ),
      });
    }

    cols.push({
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Menu untuk ${row.original.full_name}`}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/lecturers/${row.original.id}`}>
                <Search className="h-4 w-4" />
                Lihat detail
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/lecturers/${row.original.id}/edit`}>
                <PencilLine className="h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={() => handleDelete(row.original)}
              disabled={pending}
              className={confirmingId === row.original.id ? 'text-[var(--danger)]' : ''}
            >
              <Trash2 className="h-4 w-4" />
              {confirmingId === row.original.id ? 'Klik lagi untuk konfirmasi' : 'Hapus'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    });

    return cols;
  }, [columnVisibility, customFields, pending, confirmingId, handleDelete]);

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting, rowSelection },
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: (row, _columnId, filterValue) => {
      const q = String(filterValue).toLowerCase().trim();
      if (!q) return true;
      const r = row.original;
      return [r.full_name, r.title, r.university, r.faculty, r.email, ...(r.tags ?? [])]
        .filter(Boolean)
        .some((s) => String(s).toLowerCase().includes(q));
    },
    initialState: { pagination: { pageSize: 20 } },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const selectedIds = React.useMemo(
    () => Object.keys(rowSelection).filter((k) => rowSelection[k]),
    [rowSelection],
  );

  function bulkDelete() {
    if (selectedIds.length === 0) return;
    if (!bulkConfirming) {
      setBulkConfirming(true);
      toast.warning(`Hapus ${selectedIds.length} dosen? Klik lagi untuk konfirmasi.`);
      window.setTimeout(() => setBulkConfirming(false), 4000);
      return;
    }
    startTransition(async () => {
      const result = await bulkDeleteLecturers(selectedIds);
      setBulkConfirming(false);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      const { deleted, blocked } = result.data;
      if (deleted > 0 && blocked === 0) {
        toast.success(`${deleted} dosen dihapus.`);
      } else if (deleted > 0 && blocked > 0) {
        toast.success(
          `${deleted} dihapus · ${blocked} di-skip karena masih terikat ke proyek.`,
        );
      } else {
        toast.error(
          `Tidak ada yang dihapus. ${blocked} dosen masih terikat ke proyek — lepas tautan dulu.`,
        );
      }
      setRowSelection({});
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Cari nama / kampus / tag…"
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-2">
          <ColumnManager
            entityType="lecturer"
            builtinColumns={BUILTIN_COLUMNS}
            customFields={customFields}
            onCustomFieldsChange={setCustomFields}
            columnVisibility={columnVisibility}
            onToggleColumn={toggleColumn}
          />
          <span className="text-xs text-[var(--text-muted)]">
            {table.getFilteredRowModel().rows.length} dosen
          </span>
        </div>
      </div>

      {selectedIds.length > 0 ? (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-[var(--danger-soft)] px-4 py-2.5 text-sm text-[var(--danger)] shadow-[var(--shadow-card)]"
          style={{ borderColor: 'var(--danger)' }}
          role="region"
          aria-label="Aksi massal terpilih"
        >
          <span className="font-medium">
            {selectedIds.length} dosen dipilih
            <span className="ml-2 text-[11px] font-normal opacity-80">
              Hapus = destruktif. Dosen yang masih terikat ke proyek akan di-skip.
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={bulkConfirming ? 'danger' : 'secondary'}
              onClick={bulkDelete}
              disabled={pending}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {bulkConfirming
                ? `Klik lagi untuk hapus ${selectedIds.length}`
                : `Hapus ${selectedIds.length}`}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setRowSelection({});
                setBulkConfirming(false);
              }}
              disabled={pending}
            >
              <X className="h-3.5 w-3.5" />
              Batal
            </Button>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: 'var(--border)' }}>
        <table className="w-full text-left">
          <thead className="bg-[var(--bg-subtle)] text-xs uppercase text-[var(--text-muted)]">
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id}>
                {hg.headers.map((header) => (
                  <th
                    key={header.id}
                    className={cn(
                      'px-4 py-2 font-medium',
                      header.column.getCanSort() && 'cursor-pointer select-none',
                    )}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                    {{ asc: ' ▲', desc: ' ▼' }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-sm text-[var(--text-muted)]"
                >
                  Tidak ada dosen yang cocok.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t transition-colors hover:bg-[var(--bg-subtle)]"
                  style={{ borderColor: 'var(--border)' }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
        <span>
          Halaman {table.getState().pagination.pageIndex + 1} dari {table.getPageCount() || 1}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Sebelumnya
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Berikutnya
          </Button>
        </div>
      </div>
    </div>
  );
}
