'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { Link } from '@/lib/i18n/routing';
import { branches } from '@/lib/api/branches';
import { governorates } from '@/lib/api/governorates';
import { clients, type ClientCreateInput } from '@/lib/api/clients';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/types/enums';
import type { PaymentFrequency } from '@/lib/types/client';
import { EGYPTIAN_MOBILE_REGEX, toE164 } from '@/lib/format/phone';
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
 * Bulk client (merchant) import — accepts .csv / .xlsx / .xls.
 * Branch and governorate resolve by name, code, or id. Staff-created
 * merchants are pre-approved. Validation runs locally before any insert.
 */

const PAYMENT_FREQUENCIES: PaymentFrequency[] = [
  'immediate',
  'weekly',
  'bi_weekly',
  'monthly',
];

const TEMPLATE_HEADERS = [
  'name',
  'name_en',
  'business_name',
  'phone',
  'phone_secondary',
  'email',
  'branch',
  'payment_method',
  'payment_frequency',
  'address_governorate',
  'address_city',
  'address_district',
  'address_street',
  'tax_number',
  'commercial_register',
  'notes',
];

const TEMPLATE_ROWS: (string | number)[][] = [
  ['متجر أحمد', 'Ahmed Store', 'Ahmed Trading', '01012345678', '', 'ahmed@store.eg', 'Cairo HQ', 'cash', 'weekly', 'Cairo', 'Cairo', 'Nasr City', '12 Abbas El Akkad', '', '', ''],
  ['نور فاشون', 'Nour Fashion', 'Nour Fashion LLC', '01112345679', '01098765432', 'orders@nour.eg', 'Cairo HQ', 'instapay', 'bi_weekly', 'Giza', '6 October', '1st District', 'Plaza 12', '123456789', 'CR-9988', 'VIP merchant'],
];

interface ParsedRow {
  raw: Record<string, string>;
  lineNumber: number;
  errors: string[];
  valid: boolean;
  resolved: { branch_id?: string; governorate_id?: string };
}

export function ClientsImport() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

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
      branch: buildLookup(branchList ?? [], (b) => [b.name.ar, b.name.en, b.code]),
      governorate: buildLookup(govList ?? [], (g) => [g.name.ar, g.name.en, g.code]),
    }),
    [branchList, govList],
  );

  function validateRow(record: Record<string, string>): {
    errors: string[];
    resolved: ParsedRow['resolved'];
  } {
    const errors: string[] = [];
    const resolved: ParsedRow['resolved'] = {};

    const name = pickColumn(record, 'name', 'name_ar');
    const phone = pickColumn(record, 'phone', 'phone_primary');
    const branchRaw = pickColumn(record, 'branch', 'branch_id', 'preferred_branch');
    const govRaw = pickColumn(record, 'address_governorate', 'governorate');
    const email = pickColumn(record, 'email');
    const method = pickColumn(record, 'payment_method').toLowerCase();
    const freq = pickColumn(record, 'payment_frequency').toLowerCase();

    if (!name) errors.push(t('pickup.clientsImport.fieldErrors.missingName'));

    if (!phone) errors.push(t('pickup.clientsImport.fieldErrors.missingPhone'));
    else if (!EGYPTIAN_MOBILE_REGEX.test(phone.replace(/[\s-]/g, ''))) {
      errors.push(t('pickup.clientsImport.fieldErrors.invalidPhone', { value: phone }));
    }

    if (!branchRaw) errors.push(t('pickup.clientsImport.fieldErrors.missingBranch'));
    else {
      const b = lookups.branch(branchRaw);
      if (!b) errors.push(t('pickup.clientsImport.fieldErrors.unknownBranch', { value: branchRaw }));
      else resolved.branch_id = b.id;
    }

    if (govRaw) {
      const g = lookups.governorate(govRaw);
      if (!g) errors.push(t('pickup.clientsImport.fieldErrors.unknownBranch', { value: govRaw }));
      else resolved.governorate_id = g.id;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push(t('pickup.clientsImport.fieldErrors.invalidEmail', { value: email }));
    }
    if (method && !PAYMENT_METHODS.includes(method as PaymentMethod)) {
      errors.push(t('pickup.clientsImport.fieldErrors.invalidPaymentMethod', { value: method }));
    }
    if (freq && !PAYMENT_FREQUENCIES.includes(freq as PaymentFrequency)) {
      errors.push(t('pickup.clientsImport.fieldErrors.invalidPaymentFrequency', { value: freq }));
    }

    return { errors, resolved };
  }

  async function handleFile(file: File) {
    if (!isImportableFile(file)) {
      toast.error(t('pickup.clientsImport.errors.unsupportedFile'));
      return;
    }
    setFileName(file.name);
    setParsing(true);
    try {
      const { headers, rows: data } = await parseSpreadsheet(file);
      if (headers.length === 0 || data.length === 0) {
        toast.error(t('pickup.clientsImport.errors.emptyFile'));
        setRows([]);
        return;
      }
      const parsed: ParsedRow[] = data.map((record, idx) => {
        const { errors, resolved } = validateRow(record);
        return { raw: record, lineNumber: idx + 2, errors, valid: errors.length === 0, resolved };
      });
      setRows(parsed);
      const validCount = parsed.filter((r) => r.valid).length;
      if (validCount === parsed.length) {
        toast.success(t('pickup.clientsImport.parsedAllValid', { count: validCount }));
      } else {
        toast.warning(
          t('pickup.clientsImport.parsedWithErrors', { valid: validCount, total: parsed.length }),
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
      const created: string[] = [];
      const failed: { line: number; error: string }[] = [];
      for (const row of rows.filter((r) => r.valid)) {
        try {
          const r = row.raw;
          const nameAr = pickColumn(r, 'name', 'name_ar');
          const nameEn = pickColumn(r, 'name_en') || nameAr;
          const bizAr = pickColumn(r, 'business_name', 'business_name_ar');
          const bizEn = pickColumn(r, 'business_name_en') || bizAr;
          const branch = branchList?.find((b) => b.id === row.resolved.branch_id);
          const city = pickColumn(r, 'address_city', 'city');
          const district = pickColumn(r, 'address_district', 'district');
          const street = pickColumn(r, 'address_street', 'street');
          const govId = row.resolved.governorate_id ?? branch?.governorate_id ?? '';
          const method = (pickColumn(r, 'payment_method').toLowerCase() || 'cash') as PaymentMethod;
          const frequency = (pickColumn(r, 'payment_frequency').toLowerCase() ||
            'weekly') as PaymentFrequency;
          const input: ClientCreateInput = {
            name: { ar: nameAr, en: nameEn },
            business_name: bizAr ? { ar: bizAr, en: bizEn } : undefined,
            phone_primary: toE164(pickColumn(r, 'phone', 'phone_primary')),
            phone_secondary: pickColumn(r, 'phone_secondary')
              ? toE164(pickColumn(r, 'phone_secondary'))
              : undefined,
            email: pickColumn(r, 'email') || undefined,
            pickup_address: {
              governorate_id: govId,
              city,
              district,
              street,
              full_address_ar: [street, district, city].filter(Boolean).join('، '),
              full_address_en: [street, district, city].filter(Boolean).join(', '),
            },
            preferred_branch_id: row.resolved.branch_id!,
            payment_terms: { method, frequency },
            tax_number: pickColumn(r, 'tax_number') || undefined,
            commercial_register: pickColumn(r, 'commercial_register') || undefined,
            notes: pickColumn(r, 'notes') || undefined,
          };
          const c = await clients.create(input);
          created.push(c.id);
        } catch (e) {
          failed.push({ line: row.lineNumber, error: e instanceof Error ? e.message : String(e) });
        }
      }
      return { created, failed };
    },
    onSuccess: ({ created, failed }) => {
      qc.invalidateQueries({ queryKey: ['clients-all'] });
      qc.invalidateQueries({ queryKey: ['clients'] });
      if (failed.length === 0) {
        toast.success(t('pickup.clientsImport.imported', { count: created.length }));
        router.push(`/${locale === 'ar' ? '' : locale + '/'}clients`);
      } else {
        toast.warning(
          t('pickup.clientsImport.importedPartial', { ok: created.length, failed: failed.length }),
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
        elementId="clients.import"
        title={t('pickup.clientsImport.title')}
        subtitle={t('pickup.clientsImport.subtitle')}
        actions={
          <Link href="/clients">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
              {t('common.back')}
            </Button>
          </Link>
        }
      />

      <FeedbackPin elementId="clients.import.controls">
        <Card>
          <CardHeader>
            <CardTitle>{t('pickup.clientsImport.uploadTitle')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-fg-muted">{t('pickup.clientsImport.uploadHint')}</p>
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
              <Button variant="primary" disabled={parsing} onClick={() => fileInput.current?.click()}>
                <Upload className="h-3.5 w-3.5" />
                {parsing ? t('common.loading') : t('pickup.clientsImport.upload')}
              </Button>
              <Button
                variant="secondary"
                onClick={() =>
                  downloadXlsxTemplate('twingo-clients-template.xlsx', TEMPLATE_HEADERS, TEMPLATE_ROWS)
                }
              >
                <Download className="h-3.5 w-3.5" />
                {t('pickup.clientsImport.downloadTemplateXlsx')}
              </Button>
              <Button
                variant="ghost"
                onClick={() =>
                  downloadCsvTemplate('twingo-clients-template.csv', TEMPLATE_HEADERS, TEMPLATE_ROWS)
                }
              >
                <Download className="h-3.5 w-3.5" />
                {t('pickup.clientsImport.downloadTemplateCsv')}
              </Button>
              {fileName && <span className="text-[11px] text-fg-muted">{fileName}</span>}
            </div>
          </CardContent>
        </Card>
      </FeedbackPin>

      {rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-fg-subtle">
                {t('pickup.clientsImport.summary.parsed')}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-primary-700">
                {formatInt(rows.length, locale)}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-fg-subtle">
                {t('pickup.clientsImport.summary.valid')}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-success">
                {formatInt(validCount, locale)}
              </div>
            </div>
            <div className="rounded-[var(--radius)] border border-border bg-surface p-4 shadow-sm">
              <div className="text-[10px] font-bold uppercase text-fg-subtle">
                {t('pickup.clientsImport.summary.errors')}
              </div>
              <div className="mt-1 text-2xl font-extrabold text-danger">
                {formatInt(errorCount, locale)}
              </div>
            </div>
          </div>

          <FeedbackPin elementId="clients.import.preview">
            <Card>
              <CardHeader>
                <CardTitle>{t('pickup.clientsImport.previewTitle')}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                <table className="w-full text-[11px]">
                  <thead className="bg-surface-muted text-[10px] font-bold uppercase text-fg-subtle">
                    <tr>
                      <th className="px-3 py-2 text-start">#</th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.clientsImport.preview.status')}
                      </th>
                      <th className="px-3 py-2 text-start">{t('pickup.clientsImport.preview.name')}</th>
                      <th className="px-3 py-2 text-start">{t('pickup.clientsImport.preview.phone')}</th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.clientsImport.preview.branch')}
                      </th>
                      <th className="px-3 py-2 text-start">
                        {t('pickup.clientsImport.preview.errors')}
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
                        <td className="px-3 py-2 font-mono text-fg-muted">{r.lineNumber}</td>
                        <td className="px-3 py-2">
                          {r.valid ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              {t('pickup.clientsImport.preview.ok')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-danger">
                              <AlertCircle className="h-3 w-3" />
                              {t('pickup.clientsImport.preview.fail')}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">{pickColumn(r.raw, 'name', 'name_ar') || '—'}</td>
                        <td className="px-3 py-2 font-mono">
                          {pickColumn(r.raw, 'phone', 'phone_primary') || '—'}
                        </td>
                        <td className="px-3 py-2 text-fg-muted">
                          {pickColumn(r.raw, 'branch', 'branch_id', 'preferred_branch') || '—'}
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
                    {t('pickup.clientsImport.preview.truncated', {
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
                : t('pickup.clientsImport.submit', { count: validCount })}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
