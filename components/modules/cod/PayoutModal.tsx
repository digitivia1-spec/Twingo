'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { codDues } from '@/lib/api/cod-dues';
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/types/enums';
import type { CodDue } from '@/lib/types/cod-due';
import type { Client } from '@/lib/types/client';
import { formatEgp, parseEgpToPiasters } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { formatEgyptianMobile } from '@/lib/format/phone';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function PayoutModal({
  due,
  client,
  onClose,
}: {
  due: CodDue | null;
  client: Client | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [reference, setReference] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [notes, setNotes] = useState('');
  const [sendWhatsapp, setSendWhatsapp] = useState(true);

  const mutation = useMutation({
    mutationFn: () =>
      due
        ? codDues.payOut(due.id, {
            payment_method: method,
            payment_reference: reference || undefined,
            amount:
              parseEgpToPiasters(amountStr) ??
              (due?.net_amount_due ?? 0),
            paid_by: 'u_nour_finance',
            send_whatsapp: sendWhatsapp,
            notes,
          })
        : Promise.reject(new Error('No due selected')),
    onSuccess: () => {
      toast.success(t('cod.payout.paid'));
      qc.invalidateQueries({ queryKey: ['cod-dues'] });
      onClose();
      setReference('');
      setAmountStr('');
      setNotes('');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const amount = parseEgpToPiasters(amountStr) ?? due?.net_amount_due ?? 0;

  return (
    <Dialog
      open={!!due}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
      className="max-w-[620px]"
    >
      <DialogHeader>
        <DialogTitle>{t('cod.payout.title')}</DialogTitle>
      </DialogHeader>

      {due && (
        <div className="space-y-4">
          <div className="rounded-lg bg-surface-muted p-3 text-xs">
            <div className="mb-1 text-[10px] font-bold tracking-wide text-fg-muted">
              {t('cod.payout.summary')}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-fg-muted">
                  {t('cod.columns.client')}
                </div>
                <div className="font-bold">
                  {client ? pickLocale(client.name, locale) : due.client_id}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-fg-muted">
                  {t('cod.columns.phone')}
                </div>
                <div className="font-mono">
                  {client ? formatEgyptianMobile(client.phone_primary) : '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-fg-muted">
                  {t('cod.columns.amount')}
                </div>
                <div className="font-extrabold text-primary-700">
                  {formatEgp(due.net_amount_due, locale)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-fg-muted">
                  {t('cod.columns.orders')}
                </div>
                <div className="font-bold">{due.orders_count}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FeedbackPin elementId="cod.payModal.method">
              <div>
                <Label required>{t('cod.payout.method')}</Label>
                <Select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                >
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {t(`paymentMethods.${m}` as const)}
                    </option>
                  ))}
                </Select>
              </div>
            </FeedbackPin>

            <FeedbackPin elementId="cod.payModal.reference">
              <div>
                <Label required={method !== 'cash'}>
                  {t('cod.payout.reference')}
                </Label>
                <Input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={method === 'cash' ? '—' : 'NBE-TRF-…'}
                  disabled={method === 'cash'}
                  dir="ltr"
                />
              </div>
            </FeedbackPin>

            <FeedbackPin elementId="cod.payModal.amount">
              <div>
                <Label>{t('cod.payout.amount')}</Label>
                <Input
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder={formatEgp(due.net_amount_due, 'en')}
                  inputMode="decimal"
                  dir="ltr"
                />
              </div>
            </FeedbackPin>

            <div>
              <Label>{t('cod.payout.notes')}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>

          <FeedbackPin elementId="cod.payModal.whatsapp">
            <div className="rounded-lg border border-primary-200 bg-primary-50 p-3">
              <label className="flex items-center gap-2 text-xs font-bold text-primary-700">
                <input
                  type="checkbox"
                  checked={sendWhatsapp}
                  onChange={(e) => setSendWhatsapp(e.target.checked)}
                />
                {t('cod.payout.sendWhatsapp')}
              </label>
              {sendWhatsapp && (
                <div className="mt-2 rounded border border-primary-200 bg-surface p-3 text-[11px] text-fg-muted">
                  <div className="mb-1 font-bold text-fg">
                    {t('cod.payout.whatsappPreview')}
                  </div>
                  <pre className="whitespace-pre-wrap font-mono">
{`مرحبا ${client ? pickLocale(client.name, 'ar') : ''} 👋
تم سداد مستحقاتك بنجاح.
المبلغ: ${formatEgp(amount, 'ar')}
عدد الأوردرات: ${due.orders_count}
تاريخ السداد: ${formatDate(new Date(), 'ar')}
رقم المرجع: ${reference || '—'}

شكراً لتعاملك مع توينجو ✨`}
                  </pre>
                </div>
              )}
            </div>
          </FeedbackPin>
        </div>
      )}

      <DialogFooter>
        <Button variant="ghost" size="md" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <FeedbackPin elementId="cod.payModal.submit">
          <Button
            variant="primary"
            size="md"
            onClick={() => mutation.mutate()}
            disabled={
              mutation.isPending ||
              (method !== 'cash' && !reference)
            }
          >
            {t('common.submit')}
          </Button>
        </FeedbackPin>
      </DialogFooter>
    </Dialog>
  );
}
