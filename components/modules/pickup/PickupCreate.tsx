'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { branches } from '@/lib/api/branches';
import { clients } from '@/lib/api/clients';
import { pickups } from '@/lib/api/pickups';
import { GOVERNORATES } from '@/lib/constants/governorates';
import { EGYPTIAN_MOBILE_REGEX, toE164 } from '@/lib/format/phone';
import { parseEgpToPiasters } from '@/lib/format/currency';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

const schema = z.object({
  client_id: z.string().min(1),
  branch_id: z.string().min(1, { message: 'branch_required' }),
  recipient_name: z.string().min(2),
  recipient_phone: z
    .string()
    .regex(EGYPTIAN_MOBILE_REGEX, { message: 'invalid_egyptian_mobile' }),
  governorate_id: z.string().min(1),
  city: z.string().min(1),
  district: z.string().min(1),
  street: z.string().min(1),
  landmark: z.string().optional(),
  weight_kg: z.coerce.number().positive(),
  pieces_count: z.coerce.number().int().positive(),
  cod_amount: z.string().default('0'),
  shipping_fee: z.string().default('0'),
  description: z.string().min(2),
  reference_code: z.string().optional(),
  is_fragile: z.boolean().default(false),
  allow_open_package: z.boolean().default(true),
  internal_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function PickupCreate() {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const router = useRouter();
  const qc = useQueryClient();

  const { data: clientsList } = useQuery({
    queryKey: ['clients'],
    queryFn: () => clients.list(),
  });
  const { data: branchesList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_id: '',
      branch_id: '',
      recipient_name: '',
      recipient_phone: '',
      governorate_id: 'gov_c',
      city: '',
      district: '',
      street: '',
      landmark: '',
      weight_kg: 1,
      pieces_count: 1,
      cod_amount: '0',
      shipping_fee: '0',
      description: '',
      reference_code: '',
      is_fragile: false,
      allow_open_package: true,
      internal_notes: '',
    },
  });

  const { register, handleSubmit, formState } = form;
  const errors = formState.errors;

  const mutation = useMutation({
    mutationFn: (v: FormValues) =>
      pickups.create({
        client_id: v.client_id,
        branch_id: v.branch_id,
        recipient: {
          name: { ar: v.recipient_name, en: v.recipient_name },
          phone_primary: toE164(v.recipient_phone),
        },
        delivery_address: {
          governorate_id: v.governorate_id,
          city: v.city,
          district: v.district,
          street: v.street,
          landmark: v.landmark,
          full_address_ar: [v.street, v.district, v.city, v.landmark]
            .filter(Boolean)
            .join('، '),
          full_address_en: [v.street, v.district, v.city, v.landmark]
            .filter(Boolean)
            .join(', '),
        },
        description: { ar: v.description, en: v.description },
        weight_kg: v.weight_kg,
        pieces_count: v.pieces_count,
        is_fragile: v.is_fragile,
        allow_open_package: v.allow_open_package,
        cod_amount: parseEgpToPiasters(v.cod_amount) ?? 0,
        shipping_fee: parseEgpToPiasters(v.shipping_fee) ?? 0,
        reference_code: v.reference_code || undefined,
        internal_notes: v.internal_notes,
      }),
    onSuccess: () => {
      toast.success(t('pickup.create.saved'));
      qc.invalidateQueries({ queryKey: ['pickups'] });
      router.push('../pickup');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <FeedbackPin elementId="pickup.create.form">
      <form
        onSubmit={handleSubmit((v) => mutation.mutate(v))}
        className="space-y-5"
      >
        <Card>
          <CardHeader>
            <CardTitle>{t('pickup.create.title')}</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Client + branch */}
            <Field
              label={t('pickup.create.client')}
              required
              error={errors.client_id && t('common.required')}
            >
              <Select {...register('client_id')} placeholder={t('pickup.create.client')}>
                <option value="" disabled>
                  —
                </option>
                {(clientsList ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {pickLocale(c.name, locale)}
                  </option>
                ))}
              </Select>
            </Field>

            <FeedbackPin elementId="pickup.create.field.branch">
              <Field
                label={t('pickup.create.branch')}
                required
                error={errors.branch_id && t('pickup.create.branchRequired')}
              >
                <Select {...register('branch_id')}>
                  <option value="" disabled>
                    —
                  </option>
                  {(branchesList ?? []).map((b) => (
                    <option key={b.id} value={b.id}>
                      {pickLocale(b.name, locale)}
                    </option>
                  ))}
                </Select>
              </Field>
            </FeedbackPin>

            {/* Recipient */}
            <FeedbackPin elementId="pickup.create.field.recipient">
              <Field
                label={t('pickup.create.recipientName')}
                required
                error={errors.recipient_name && t('common.required')}
              >
                <Input {...register('recipient_name')} />
              </Field>
            </FeedbackPin>

            <FeedbackPin elementId="pickup.create.field.phone">
              <Field
                label={t('pickup.create.recipientPhone')}
                required
                hint={t('pickup.create.phoneHint')}
                error={errors.recipient_phone && t('pickup.errors.invalidPhone')}
              >
                <Input
                  {...register('recipient_phone')}
                  placeholder="01012345678"
                  inputMode="tel"
                  dir="ltr"
                />
              </Field>
            </FeedbackPin>

            {/* Address */}
            <FeedbackPin elementId="pickup.create.field.address" className="md:col-span-2">
              <fieldset className="grid grid-cols-1 gap-3 md:grid-cols-4 rounded-lg border border-border p-3">
                <legend className="px-2 text-[11px] font-bold text-fg-muted">
                  {t('pickup.create.address')}
                </legend>
                <Field label={t('pickup.create.governorate')} required>
                  <Select {...register('governorate_id')}>
                    {GOVERNORATES.filter((g) => g.is_active).map((g) => (
                      <option key={g.id} value={g.id}>
                        {pickLocale(g.name, locale)}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label={t('pickup.create.city')}
                  required
                  error={errors.city && t('common.required')}
                >
                  <Input {...register('city')} />
                </Field>
                <Field
                  label={t('pickup.create.district')}
                  required
                  error={errors.district && t('common.required')}
                >
                  <Input {...register('district')} />
                </Field>
                <Field
                  label={t('pickup.create.street')}
                  required
                  error={errors.street && t('common.required')}
                >
                  <Input {...register('street')} />
                </Field>
                <Field label={t('pickup.create.landmark')}>
                  <Input
                    {...register('landmark')}
                    placeholder={t('pickup.create.landmark')}
                    className="md:col-span-4"
                  />
                </Field>
              </fieldset>
            </FeedbackPin>

            {/* Package */}
            <FeedbackPin elementId="pickup.create.field.weight">
              <Field
                label={t('pickup.create.weight')}
                required
                error={errors.weight_kg && t('common.required')}
              >
                <Input
                  type="number"
                  step="0.1"
                  min={0.1}
                  {...register('weight_kg')}
                />
              </Field>
            </FeedbackPin>

            <Field label={t('pickup.create.pieces')} required>
              <Input
                type="number"
                min={1}
                step={1}
                {...register('pieces_count')}
              />
            </Field>

            {/* Money */}
            <FeedbackPin elementId="pickup.create.field.cod">
              <Field label={t('pickup.create.cod')}>
                <Input {...register('cod_amount')} placeholder="0" inputMode="decimal" dir="ltr" />
              </Field>
            </FeedbackPin>

            <Field label={t('pickup.create.shipping')}>
              <Input
                {...register('shipping_fee')}
                placeholder="0"
                inputMode="decimal"
                dir="ltr"
              />
            </Field>

            <Field label={t('pickup.columns.referenceCode')} className="md:col-span-2">
              <Input {...register('reference_code')} />
            </Field>

            <Field
              label={t('pickup.create.description')}
              required
              className="md:col-span-2"
              error={errors.description && t('common.required')}
            >
              <Input {...register('description')} />
            </Field>

            <Field label={t('pickup.create.internalNotes')} className="md:col-span-2">
              <Textarea {...register('internal_notes')} rows={3} />
            </Field>

            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" {...register('is_fragile')} />
              {t('pickup.create.fragile')}
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" {...register('allow_open_package')} />
              {t('pickup.create.allowOpen')}
            </label>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => router.back()}
          >
            {t('common.cancel')}
          </Button>
          <FeedbackPin elementId="pickup.create.submit">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </FeedbackPin>
        </div>
      </form>
    </FeedbackPin>
  );
}

function Field({
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <Label required={required} className="mb-1 block">
        {label}
      </Label>
      {children}
      {error && <p className="mt-1 text-[10px] text-danger">{error}</p>}
      {hint && !error && (
        <p className="mt-1 text-[10px] text-fg-subtle">{hint}</p>
      )}
    </div>
  );
}
