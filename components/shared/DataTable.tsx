'use client';

import { useState } from 'react';
import { ChevronDown, Columns3 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem } from '@/components/ui/dropdown';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from './EmptyState';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  width?: string;
  /** Hide-able toggle */
  togglable?: boolean;
  /** Hide by default */
  defaultHidden?: boolean;
}

export interface DataTableProps<T> {
  elementId: string;
  columns: DataTableColumn<T>[];
  rows: T[];
  isLoading?: boolean;
  rowKey: (row: T) => string;
  rowLocked?: (row: T) => boolean;
  /** Optional click handler for the whole row. */
  onRowClick?: (row: T) => void;
  /** Empty-state override. */
  emptyState?: React.ReactNode;
  /** Pagination. Supply to enable; pass undefined for no pagination. */
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T>({
  elementId,
  columns,
  rows,
  isLoading,
  rowKey,
  rowLocked,
  onRowClick,
  emptyState,
  pagination,
}: DataTableProps<T>) {
  const t = useTranslations('common');
  const [hidden, setHidden] = useState<Set<string>>(
    new Set(columns.filter((c) => c.defaultHidden).map((c) => c.id)),
  );
  const visible = columns.filter((c) => !hidden.has(c.id));

  function toggleColumn(id: string) {
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <FeedbackPin elementId={`${elementId}.columnsToggle`}>
          <Dropdown
            trigger={
              <Button variant="secondary" size="sm" className="gap-2">
                <Columns3 className="h-3.5 w-3.5" />
                {t('columns')}
                <ChevronDown className="h-3 w-3" />
              </Button>
            }
            align="end"
          >
            {columns
              .filter((c) => c.togglable !== false)
              .map((c) => (
                <DropdownItem
                  key={c.id}
                  onClick={(e) => {
                    e.preventDefault();
                    toggleColumn(c.id);
                  }}
                >
                  <span className="flex w-full items-center justify-between gap-3">
                    <span>{c.header}</span>
                    <span className="text-[10px] text-fg-subtle">
                      {hidden.has(c.id) ? '○' : '●'}
                    </span>
                  </span>
                </DropdownItem>
              ))}
          </Dropdown>
        </FeedbackPin>
      </div>

      <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-surface shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              {visible.map((col) => (
                <TableHead
                  key={col.id}
                  style={col.width ? { width: col.width } : undefined}
                  className="group relative"
                >
                  <FeedbackPin
                    elementId={`${elementId}.col.${col.id}`}
                    inline
                  >
                    <span>{col.header}</span>
                  </FeedbackPin>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={`sk-${i}`}>
                  {visible.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visible.length}
                  className="py-10 text-center"
                >
                  {emptyState ?? <EmptyState />}
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={rowKey(row)}
                  data-locked={rowLocked?.(row) ? 'true' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(onRowClick && 'cursor-pointer')}
                >
                  {visible.map((col) => (
                    <TableCell key={col.id}>{col.cell(row)}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <FeedbackPin elementId={`${elementId}.pagination`}>
          <Pagination {...pagination} />
        </FeedbackPin>
      )}
    </div>
  );
}

function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: NonNullable<DataTableProps<unknown>['pagination']>) {
  const t = useTranslations('common');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex items-center justify-between text-[11px] text-fg-muted">
      <div>
        {total} {t('results')}
      </div>
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          ‹
        </Button>
        <span className="px-2">
          {t('page')} {page} {t('of')} {totalPages}
        </span>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          ›
        </Button>
      </div>
    </div>
  );
}
