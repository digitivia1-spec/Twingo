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
import {
  downloadCsvTemplate,
  downloadXlsxTemplate,
  isImportableFile,
  parseSpreadsheet,
} from '@/lib/import/spreadsheet';
import { buildLookup, pickColumn } from '@/lib/import/resolve';
import type { Locale } from '@/lib/i18n/config';

/**
 * Bulk pickup import — accepts .csv / .xlsx / .xls.
 *
 * Columns are matched case-insensitively and a few friendly aliases are
 * accepted. Client, branch and governorate may be given by slug id, code,
 * or (bilingual) name — they're resolved against the live directory before
 * any row hits the API. Validation runs locally so the user can preview and
 * fix problems first; only valid rows are submitted, one at a time, so
 * per-row failures surface.
 */

const TEMPLATE_HEADERS = [
  'client',
  'branch',
  'order_type',
  'recipient_name',
  'recipient_phone',
  'governorate',
  'city',
  'district',
  'street',
  'landmark',
  'weight_kg',
  'pieces_count',
  'cod_amount',
  'shipping_fee',
  'description',
  'reference_code',
  'is_fragile',
  'allow_open_package',
  'internal_notes',
];

const TEMPLATE_ROWS: (string | number)[][] = [
  ['Ahmed Store', 'Cairo HQ', 'forward', 'Sara Mohamed', '01012345678', 'Cairo', 'Cairo', 'Zamalek', '26 July St', 'Near Marriott', 1.2, 1, 150, 55, 'Running shoes', 'REF-001', 'false', 'true', ''],
  ['Nour Fashion', 'Cairo HQ', 'exchange', 'Mahmoud Ali', '01112345679', 'Cairo', 'Cairo', 'Nasr City', 'Makram Ebeid', '', 0.5, 1, 0, 40, 'Dress size exchange', 'REF-002', 'false', 'true', 'Size swap'],
  ['Tech Hub', 'October Branch', 'forward', 'Heba Adel', '01212345680', 'Giza', '6 October', '12th District', 'Plaza 23', 'Behind Dandy Mall', 0.4, 1, 290, 75, 'Bluetooth headset', 'REF-003', 'true', 'false', 'Fragile electronics'],
];

interface ParsedRow {
  raw: Record<string, string>;
  lineNumber: number;
  errors: string[];
  valid: boolean;
  // Resolved slug ids (when resolution succeeded).
  resolved: {
    client_id?: string;
    branch_id?: string;
    governorate_id?: string;
  };
}

export function PickupImport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

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

  const lookups = useMemo(
    () => ({
      client: buildLookup(clientList ?? [], (c) => [
        c.name.ar,
        c.name.en,
        c.business_name?.ar,
        c.business_name?.en,
        c.phone_primary,
      ]),
      branch: buildLookup(branchList ?? [], (b) => [b.name.ar, b.name.en, b.code]),
      governorate: buildLookup(govList ?? [], (g) => [g.name.ar, g.name.en, g.code]),
    }),
    [clientList, branchList, govList],
  );

  function validateRow(record: Record<string, string>): {
    errors: string[];
    resolved: ParsedRow['resolved'];
  } {
    const errors: string[] = [];
    const resolved: ParsedRow['resolved'] = {};

    const clientRaw = pickColumn(record, 'client', 'client_id', 'merchant');
    const branchRaw = pickColumn(record, 'branch', 'branch_id');
    const govRaw = pickColumn(record, 'governorate', 'governorate_id', 'province');
    const recipientName = pickColumn(record, 'recipient_name', 'recipient');
    const phone = pickColumn(record, 'recipient_phone', 'phone');
    const city = pickColumn(record, 'city');
    const district = pickColumn(record, 'district');
    const street = pickColumn(record, 'street', 'address');
    const description = pickColumn(record, 'description', 'item');
    const weight = pickColumn(record, 'weight_kg', 'weight');
    const pieces = pickColumn(record, 'pieces_count', 'pieces');
    const cod = pickColumn(record, 'cod_amount', 'cod');
    const orderType = pickColumn(record, 'order_type', 'type');

    if (!clientRaw) errors.push(t('pickup.import.fieldErrors.missingClient'));
    else {
      const c = lookups.client(clientRaw);
      if (!c) errors.push(t('pickup.import.fieldErrors.unknownClient', { value: clientRaw }));
      else resolved.client_id = c.id;
    }

    if (!branchRaw) errors.push(t('pickup.import.fieldErrors.missingBranch'));
    else {
      const b = lookups.branch(branchRaw);
      if (!b) errors.push(t('pickup.import.fieldErrors.unknownBranch', { value: branchRaw }));
      else resolved.branch_id = b.id;
    }

    if (!govRaw) errors.push(t('pickup.import.fieldErrors.missingGovernorate'));
    else {
      const g = lookups.governorate(govRaw);
      if (!g) errors.push(t('pickup.import.fieldErrors.unknownGovernorate', { value: govRaw }));
      else resolved.governorate_id = g.id;
    }

    if (!recipientName) errors.push(t('pickup.import.fieldErrors.missingRecipient'));
    if (!city) errors.push(t('pickup.import.fieldErrors.missingCity'));
    if (!district) errors.push(t('pickup.import.fieldErrors.missingDistrict'));
    if (!street) errors.push(t('pickup.import.fieldErrors.missingStreet'));
    if (!description) errors.push(t('pickup.import.fieldErrors.missingDescription'));

    if (!phone) errors.push(t('pickup.import.fieldErrors.missingPhone'));
    else if (!EGYPTIAN_MOBILE_REGEX.test(phone.replace(/[\s-]/g, ''))) {
      errors.push(t('pickup.import.fieldErrors.invalidPhone', { value: phone }));
    }

    if (!weight) errors.push(t('pickup.import.fieldErrors.missingWeight'));
    else {
      const w = Number(weight);
      if (!Number.isFinite(w) || w <= 0)
        errors.push(t('pickup.import.fieldErrors.invalidWeight', { value: weight }));
    }

    if (!pieces) errors.push(t('pickup.import.fieldErrors.missingPieces'));
    else {
      const p = Number(pieces);
      if (!Number.isFinite(p) || !Number.isInteger(p) || p <= 0)
        errors.push(t('pickup.import.fieldErrors.invalidPieces', { value: pieces }));
    }

    if (orderType && !ORDER_TYPES.includes(orderType as OrderType)) {
      errors.push(t('pickup.import.fieldErrors.invalidOrderType', { value: orderType }));
    }

    if (cod && parseEgpToPiasters(cod) === null) {
      errors.push(t('pickup.import.fieldErrors.invalidCod', { value: cod }));
    }

    return { errors, resolved };
  }

  async function handleFile(file: File) {
    if (!isImportableFile(file)) {
      toast.error(t('pickup.import.errors.unsupportedFile'));
      return;
    }
    setFileName(file.name);
    setParsing(true);
    try {
      const { headers, rows: data } = await parseSpreadsheet(file);
      if (headers.length === 0 || data.length === 0) {
        toast.error(t('pickup.import.errors.emptyFile'));
        setRows([]);
        return;
      }
      const parsed: ParsedRow[] = data.map((record, idx) => {
        const { errors, resolved } = validateRow(record);
        return {
          raw: record,
          lineNumber: idx + 2, // +2: header row + 1-indexed display
          errors,
          valid: errors.length === 0,
          resolved,
        };
      });
      setRows(parsed);
      const validCount = parsed.filter((r) => r.valid).length;
      if (validCount === parsed.length) {
        toast.success(t('pickup.import.parsedAllValid', { count: validCount }));
      } else {
        toast.warning(
          t('pickup.import.parsedWithErrors', {
            valid: validCount,
            total: parsed.length,
          }),
        );
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setParsing(false);
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
          const recipientName = pickColumn(r, 'recipient_name', 'recipient');
          const city = pickColumn(r, 'city');
          const district = pickColumn(r, 'district');
          const street = pickColumn(r, 'street', 'address');
          const landmark = pickColumn(r, 'landmark');
          const created_pk = await pickups.create({
            client_id: row.resolved.client_id!,
            branch_id: row.resolved.branch_id!,
            order_type: (pickColumn(r, 'order_type', 'type') || 'forward') as OrderType,
            submission_source: 'csv_import',
            recipient: {
              name: { ar: recipientName, en: recipientName },
              phone_primary: toE164(pickColumn(r, 'recipient_phone', 'phone')),
            },
            delivery_address: {
              governorate_id: row.resolved.governorate_id!,
              city,
              district,
              street,
              landmark: landmark || undefined,
              full_address_ar: [street, district, city, landmark]
                .filter(Boolean)
                .join('، '),
              full_address_en: [street, district, city, landmark]
                .filter(Boolean)
                .join(', '),
            },
            description: (() => {
              const d = pickColumn(r, 'description', 'item');
              return { ar: d, en: d };
            })(),
            weight_kg: Number(pickColumn(r, 'weight_kg', 'weight')),
            pieces_count: Number(pickColumn(r, 'pieces_count', 'pieces')),
            is_fragile: /^(true|yes|1)$/i.test(pickColumn(r, 'is_fragile', 'fragile')),
            allow_open_package:
              !/^(false|no|0)$/i.test(pickColumn(r, 'allow_open_package', 'open_package')),
            cod_amount: parseEgpToPiasters(pickColumn(r, 'cod_amount', 'cod') || '0') ?? 0,
            shipping_fee:
              parseEgpToPiasters(pickColumn(r, 'shipping_fee', 'shipping') || '0') ?? 0,
            reference_code: pickColumn(r, 'reference_code', 'reference') || undefined,
            internal_notes: pickColumn(r, 'internal_notes', 'notes') || undefined,
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
        toast.success(t('pickup.import.imported', { count: created.length }));
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
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = '';
                }}
              />
              <Button
                variant="primary"
                disabled={parsing}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                {parsing ? t('common.loading') : t('pickup.import.upload')}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadXlsxTemplate(
                    'twingo-pickup-template.xlsx',
                    TEMPLATE_HEADERS,
                    TEMPLATE_ROWS,
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />
                {t('pickup.import.downloadTemplateXlsx')}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  downloadCsvTemplate(
                    'twingo-pickup-template.csv',
                    TEMPLATE_HEADERS,
                    TEMPLATE_ROWS,
                  )
                }
              >
                <Download className="h-3.5 w-3.5" />
                {t('pickup.import.downloadTemplateCsv')}
              </Button>
              {fileName && (
                <span className="text-[11px] text-fg-muted">{fileName}</span>
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
                        <td className="px-3 py-2 text-fg-muted">
                          {pickColumn(r.raw, 'client', 'client_id', 'merchant') || '—'}
                        </td>
                        <td className="px-3 py-2">
                          {pickColumn(r.raw, 'recipient_name', 'recipient') || '—'}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {pickColumn(r.raw, 'recipient_phone', 'phone') || '—'}
                        </td>
                        <td className="px-3 py-2 text-fg-muted">
                          {pickColumn(r.raw, 'governorate', 'governorate_id', 'province') || '—'}
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
