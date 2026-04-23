'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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
import { branches } from '@/lib/api/branches';
import { GOVERNORATES } from '@/lib/constants/governorates';
import type { Branch } from '@/lib/types/branch';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

export function BranchEditModal({
  branch,
  onClose,
}: {
  branch: Branch | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [city, setCity] = useState('');
  const [governorate, setGovernorate] = useState('gov_c');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!branch) return;
    setNameAr(branch.name.ar);
    setNameEn(branch.name.en);
    setCity(branch.city);
    setGovernorate(branch.governorate_id);
    setAddress(branch.address);
    setPhone(branch.phone);
    setIsActive(branch.is_active);
  }, [branch]);

  const mutation = useMutation({
    mutationFn: () =>
      branch
        ? branches.update(branch.id, {
            name: { ar: nameAr, en: nameEn },
            city,
            governorate_id: governorate,
            address,
            phone,
            is_active: isActive,
          })
        : Promise.reject(new Error('No branch selected')),
    onSuccess: () => {
      toast.success('✓');
      qc.invalidateQueries({ queryKey: ['branches'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <FeedbackPin elementId="branches.editForm">
      <Dialog
        open={!!branch}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
        className="max-w-[640px]"
      >
        <DialogHeader>
          <DialogTitle>{t('branches.editTitle')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <FeedbackPin elementId="branches.editForm.nameAr">
            <div>
              <Label required>{t('branches.form.nameAr')}</Label>
              <Input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
              />
            </div>
          </FeedbackPin>

          <FeedbackPin elementId="branches.editForm.nameEn">
            <div>
              <Label>{t('branches.form.nameEn')}</Label>
              <Input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
              />
            </div>
          </FeedbackPin>

          <div>
            <Label required>{t('branches.form.governorate')}</Label>
            <Select
              value={governorate}
              onChange={(e) => setGovernorate(e.target.value)}
            >
              {GOVERNORATES.map((g) => (
                <option key={g.id} value={g.id}>
                  {pickLocale(g.name, locale)}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Label required>{t('branches.form.city')}</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>

          <div className="col-span-2">
            <Label required>{t('branches.form.address')}</Label>
            <Textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Label required>{t('branches.form.phone')}</Label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
          </div>

          <div>
            <Label>{t('branches.form.isActive')}</Label>
            <label className="mt-2 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              {isActive ? t('common.yes') : t('common.no')}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <FeedbackPin elementId="branches.editForm.submit">
            <Button
              variant="primary"
              size="md"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
            >
              {t('common.save')}
            </Button>
          </FeedbackPin>
        </DialogFooter>
      </Dialog>
    </FeedbackPin>
  );
}
