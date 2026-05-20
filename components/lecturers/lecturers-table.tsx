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
import { MoreHorizontal, PencilLine, Search, Trash2 } from 'lucide-react';
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
import { deleteLecturer, type LecturerRow } from '@/lib/actions/lecturers';
import { cn } from '@/lib/utils';

interface LecturersTableProps {
  data: LecturerRow[];
}

export function LecturersTable({ data }: LecturersTableProps) {
  const [globalFilter, setGlobalFilter] = React.useState('');
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: 'full_name', desc: false },
  ]);
  const [pending, startTransition] = React.useTransition();
  const [confirmingId, setConfirmingId] = React.useState<string | null>(null);

  const handleDelete = (row: LecturerRow) => {
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
  };

  const columns = React.useMemo<ColumnDef<LecturerRow>[]>(
    () => [
      {
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
      },
      {
        accessorKey: 'university',
        header: 'Kampus',
        cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? '—'}</span>,
      },
      {
        accessorKey: 'faculty',
        header: 'Fakultas',
        cell: ({ getValue }) => <span className="text-sm">{getValue<string | null>() ?? '—'}</span>,
      },
      {
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
      },
      {
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
      },
    ],
    [pending, confirmingId],
  );

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter, sorting },
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
        <span className="text-xs text-[var(--text-muted)]">
          {table.getFilteredRowModel().rows.length} dosen
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--border)' }}>
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
