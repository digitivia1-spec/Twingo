'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Upload,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { Link } from '@/lib/i18n/routing';
import { branches } from '@/lib/api/branches';
import { clients } from '@/lib/api/clients';
import { governorates } from '@/lib/api/governorates';
import { pickups } from '@/lib/api/pickups';
import { ORDER_TYPES, type OrderType } from '@/lib/types/enums';
import { EGYPTIAN_MOBILE_REGEX, toE164 } from '@/lib/format/phone';
import { parseEgpToPiasters } from '@/lib/format/currency';
import { formatInt } from '@/lib/format/numbers';
import type { Locale } from '@/lib/i18n/config';

/**
 * Bulk pickup import — CSV-based, matches the legacy tool's pattern.
 *
 * Columns (case-insensitive, order-sensitive but extras tolerated):
 *   client_id, branch_id, order_type, recipient_name, recipient_phone,
 *   governorate_id, city, district, street, landmark, weight_kg,
 *   pieces_count, cod_amount, shipping_fee, description, reference_code,
 *   is_fragile, allow_open_package, internal_notes
 *
 * Validation is local (in the browser) so the user can preview and fix
 * before any rows hit the API. Invalid rows are not submitted; valid
 * rows go through pickups.create one at a time so per-row errors surface.
 */

interface ParsedRow {
  raw: Record<string, string>;
  lineNumber: number;
  errors: string[];
  valid: boolean;
}

const REQUIRED_COLUMNS = [
  'client_id',
  'branch_id',
  'recipient_name',
  'recipient_phone',
  'governorate_id',
  'city',
  'district',
  'street',
  'weight_kg',
  'pieces_count',
  'description',
] as const;

const SAMPLE_CSV = `client_id,branch_id,order_type,recipient_name,recipient_phone,governorate_id,city,district,street,landmark,weight_kg,pieces_count,cod_amount,shipping_fee,description,reference_code,is_fragile,allow_open_package,internal_notes
cl_ahmed_store,br_cairo_hq,forward,Sara Mohamed,01012345678,gov_c,Cairo,Zamalek,26 July St,Near Marriott,1.2,1,150,55,Running shoes,REF-001,false,true,
cl_nour_fashion,br_cairo_hq,exchange,Mahmoud Ali,01112345679,gov_c,Cairo,Nasr City,Makram Ebeid,,0.5,1,0,40,Dress size exchange,REF-002,false,true,Size swap
cl_tech_hub,br_october,forward,Heba Adel,01212345680,gov_gz,6 October,12th District,Plaza 23,Behind Dandy Mall,0.4,1,290,75,Bluetooth headset,REF-003,true,false,Fragile electronics`;

export function PickupImport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  const { data: clientList } = useQuery({
    queryKey: ['clients-all'],
    queryFn: () => clients.list(),
  });
  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });
  const { data: govList } = useQuery({
    queryKey: ['governorates'],
    queryFn: () => governorates.list(),
  });

  const validIds = useMemo(
    () => ({
      clients: new Set((clientList ?? []).map((c) => c.id)),
      branches: new Set((branchList ?? []).map((b) => b.id)),
      governorates: new Set((govList ?? []).map((g) => g.id)),
    }),
    [clientList, branchList, govList],
  );

  /** Parse a single CSV cell — strips quotes, handles escaped quotes. */
  function parseCell(s: string): string {
    let v = s.trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.slice(1, -1).replace(/""/g, '"');
    }
    return v;
  }

  /** Naive but correct enough CSV parser for our use case. */
  function parseCsv(text: string): { headers: string[]; rows: string[][] } {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return { headers: [], rows: [] };
    const split = (line: string): string[] => {
      const out: string[] = [];
      let cur = '';
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuote) {
          if (ch === '"' && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else if (ch === '"') {
            inQuote = false;
          } else {
            cur += ch;
          }
        } else if (ch === ',') {
          out.push(cur);
          cur = '';
        } else if (ch === '"' && cur === '') {
          inQuote = true;
        } else {
          cur += ch;
        }
      }
      out.push(cur);
      return out.map((s) => s.trim());
    };
    const headers = split(lines[0]!).map((h) => h.toLowerCase());
    const rows = lines
      .slice(1)
      .map((l) => split(l).map((c) => parseCell(c)));
    return { headers, rows };
  }

  function validateRow(record: Record<string, string>): string[] {
    const errors: string[] = [];

    for (const col of REQUIRED_COLUMNS) {
      if (!record[col] || record[col].trim() === '') {
        errors.push(`Missing ${col}`);
      }
    }

    if (record.client_id && !validIds.clients.has(record.client_id)) {
      errors.push(`Unknown client_id ${record.client_id}`);
    }
    if (record.branch_id && !validIds.branches.has(record.branch_id)) {
      errors.push(`Unknown branch_id ${record.branch_id}`);
    }
    if (
      record.governorate_id &&
      !validIds.governorates.has(record.governorate_id)
    ) {
      errors.push(`Unknown governorate_id ${record.governorate_id}`);
    }

    if (
      record.order_type &&
      !ORDER_TYPES.includes(record.order_type as OrderType)
    ) {
      errors.push(`Invalid order_type ${record.order_type}`);
    }

    if (record.recipient_phone) {
      const clean = record.recipient_phone.replace(/[\s-]/g, '');
      if (!EGYPTIAN_MOBILE_REGEX.test(clean)) {
        errors.push(`Invalid phone ${record.recipient_phone}`);
      }
    }

    if (record.weight_kg) {
      const w = Number(record.weight_kg);
      if (!Number.isFinite(w) || w <= 0)
        errors.push(`Invalid weight_kg ${record.weight_kg}`);
    }

    if (record.pieces_count) {
      const p = Number(record.pieces_count);
      if (!Number.isFinite(p) || !Number.isInteger(p) || p <= 0)
        errors.push(`Invalid pieces_count ${record.pieces_count}`);
    }

    if (record.cod_amount && parseEgpToPiasters(record.cod_amount) === null) {
      errors.push(`Invalid cod_amount ${record.cod_amount}`);
    }

    return errors;
  }

  async function handleFile(file: File) {
    setFileName(file.name);
    const text = await file.text();
    const { headers, rows: data } = parseCsv(text);
    if (headers.length === 0) {
      toast.error(t('pickup.import.errors.emptyFile'));
      return;
    }
    const missing = REQUIRED_COLUMNS.filter((c) => !headers.includes(c));
    if (missing.length > 0) {
      toast.error(
        `${t('pickup.import.errors.missingColumns')}: ${missing.join(', ')}`,
      );
      return;
    }
    const parsed: ParsedRow[] = data.map((cells, idx) => {
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        record[h] = cells[i] ?? '';
      });
      const errors = validateRow(record);
      return {
        raw: record,
        lineNumber: idx + 2, // +2 to account for header + 1-indexed display
        errors,
        valid: errors.length === 0,
      };
    });
    setRows(parsed);
    const validCount = parsed.filter((r) => r.valid).length;
    if (validCount === parsed.length) {
      toast.success(
        t('pickup.import.parsedAllValid', { count: validCount }),
      );
    } else {
      toast.warning(
        t('pickup.import.parsedWithErrors', {
          valid: validCount,
          total: parsed.length,
        }),
      );
    }
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const validRows = rows.filter((r) => r.valid);
      const created: string[] = [];
      const failed: { line: number; error: string }[] = [];
      for (const row of validRows) {
        try {
          const r = row.raw;
          const created_pk = await pickups.create({
            client_id: r.client_id!,
            branch_id: r.branch_id!,
            order_type: (r.order_type || 'forward') as OrderType,
            submission_source: 'csv_import',
            recipient: {
              name: { ar: r.recipient_name!, en: r.recipient_name! },
              phone_primary: toE164(r.recipient_phone!),
            },
            delivery_address: {
              governorate_id: r.governorate_id!,
              city: r.city!,
              district: r.district!,
              street: r.street!,
              landmark: r.landmark || undefined,
              full_address_ar: [r.street, r.district, r.city, r.landmark]
                .filter(Boolean)
                .join('، '),
              full_address_en: [r.street, r.district, r.city, r.landmark]
                .filter(Boolean)
                .join(', '),
            },
            description: { ar: r.description!, en: r.description! },
            weight_kg: Number(r.weight_kg),
            pieces_count: Number(r.pieces_count),
            is_fragile: r.is_fragile?.toLowerCase() === 'true',
            allow_open_package:
              r.allow_open_package?.toLowerCase() !== 'false',
            cod_amount: parseEgpToPiasters(r.cod_amount || '0') ?? 0,
            shipping_fee: parseEgpToPiasters(r.shipping_fee || '0') ?? 0,
            reference_code: r.reference_code || undefined,
            internal_notes: r.internal_notes || undefined,
          });
          created.push(created_pk.code);
        } catch (e) {
          failed.push({
            line: row.lineNumber,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
      return { created, failed };
    },
    onSuccess: ({ created, failed }) => {
      qc.invalidateQueries({ queryKey: ['pickups'] });
      if (failed.length === 0) {
        toast.success(
          t('pickup.import.imported', { count: created.length }),
        );
        router.push(`/${locale === 'ar' ? '' : locale + '/'}pickup`);
      } else {
        toast.warning(
          t('pickup.import.importedPartial', {
            ok: created.length,
            failed: failed.length,
          }),
        );
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function downloadSample() {
    const blob = new Blob([SAMPLE_CSV], {
      type: 'text/csv;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'twingo-pickup-sample.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  const validCount = rows.filter((r) => r.valid).length;
  const errorCount = rows.length - validCount;

  return (
    <>
      <PageHeader
        elementId="pickup.import"
        title={t('pickup.import.title')}
        subtitle={t('pickup.import.subtitle')}
        actions={
          <Link href="/pickup">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              {t('common.back')}
            </Button>
          </Link>
        }
      />

      <FeedbackPin elementId="pickup.import.controls">
        <Card>
          <CardHeader>
            <CardTitle>{t('pickup.import.uploadTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-fg-muted">
              {t('pickup.import.uploadHint')}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                }}
              />
              <Button
                variant="primary"
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {t('pickup.import.upload')}
              </Button>
              <Button variant="secondary" onClick={downloadSample}>
                <Download className="h-3.5 w-3.5" />
                {t('pickup.import.downloadSample')}
              </Button>
              {fileName && (
                <span className="text-[11px] text-fg-muted">
                  {fileName}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </FeedbackPin>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-fg-subtle">
                {t('pickup.import.summary.parsed')}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-primary-700">
                {formatInt(rows.length, locale)}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-fg-subtle">
                {t('pickup.import.summary.valid')}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-success">
                {formatInt(validCount, locale)}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-fg-subtle">
                {t('pickup.import.summary.errors')}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-danger">
                {formatInt(errorCount, locale)}
              </div>
            </div>
          </div>

          <FeedbackPin elementId="pickup.import.preview">
            <Card>
              <CardHeader>
                <CardTitle>{t('pickup.import.previewTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-[11px]">
                  <thead className="bg-surface-muted text-[10px] font-bold uppercase text-fg-subtle">
                    <tr>
                      <th className="px-3 py-2 text-start">#</th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.import.preview.status')}
                      </th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.import.preview.merchant')}
                      </th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.import.preview.recipient')}
                      </th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.import.preview.phone')}
                      </th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.import.preview.governorate')}
                      </th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.import.preview.errors')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.slice(0, 100).map((r) => (
                      <tr
                        key={r.lineNumber}
                        className="border-t border-border hover:bg-surface-hover"
                        data-invalid={r.valid ? undefined : 'true'}
                      >
                        <td className="px-3 py-2 font-mono text-fg-muted">
                          {r.lineNumber}
                        </td>
                        <td className="px-3 py-2">
                          {r.valid ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('pickup.import.preview.ok')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger">
                              <AlertCircle className="h-3 w-3" />
                              {t('pickup.import.preview.fail')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-fg-muted">
                          {r.raw.client_id ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          {r.raw.recipient_name ?? '—'}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.raw.recipient_phone ?? '—'}
                        </td>
                        <td className="px-3 py-2 font-mono text-fg-muted">
                          {r.raw.governorate_id ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          {r.errors.length === 0 ? (
                            <span className="text-fg-subtle">—</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {r.errors.map((e, i) => (
                                <Badge key={i} tone="danger">
                                  {e}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {rows.length > 100 && (
                  <p className="px-3 py-2 text-[10px] text-fg-subtle">
                    {t('pickup.import.preview.truncated', {
                      shown: 100,
                      total: rows.length,
                    })}
                  </p>
                )}
              </CardContent>
            </Card>
          </FeedbackPin>

          <div className="flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setRows([]);
                setFileName(null);
              }}
            >
              {t('common.reset')}
            </Button>
            <Button
              variant="primary"
              size="lg"
              disabled={validCount === 0 || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending
                ? t('common.loading')
                : t('pickup.import.submit', { count: validCount })}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
