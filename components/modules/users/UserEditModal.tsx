'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { branches } from '@/lib/api/branches';
import { users, type UserCreateInput, type UserUpdateInput } from '@/lib/api/users';
import { USER_ROLES, VEHICLE_TYPES, type UserRole, type VehicleType } from '@/lib/types/enums';
import type { User } from '@/lib/types/user';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

/**
 * Create / edit a staff member. On create we also create the auth login
 * (server-side, service-role); on edit we patch role/branch/contact and may
 * toggle active state. Password changes go through the reset modal.
 */
export function UserEditModal({
  open,
  user,
  onClose,
}: {
  open: boolean;
  /** null → create mode; a User → edit mode. */
  user: User | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const qc = useQueryClient();
  const isEdit = !!user;

  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [branchId, setBranchId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [driverCode, setDriverCode] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType | ''>('');

  const { data: branchList } = useQuery({
    queryKey: ['branches'],
    queryFn: () => branches.list(),
  });

  useEffect(() => {
    if (!open) return;
    setNameAr(user?.name.ar ?? '');
    setNameEn(user?.name.en ?? '');
    setEmail(user?.email ?? '');
    setPassword('');
    setPhone(user?.phone ?? '');
    setRole(user?.role ?? 'manager');
    setBranchId(user?.branch_id ?? '');
    setIsActive(user?.is_active ?? true);
    setDriverCode(user?.driver_code ?? '');
    setVehicleType(user?.vehicle_type ?? '');
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const name = { ar: nameAr || nameEn, en: nameEn || nameAr };
      const driverFields =
        role === 'driver'
          ? {
              driver_code: driverCode || undefined,
              vehicle_type: (vehicleType || undefined) as VehicleType | undefined,
            }
          : {};
      if (isEdit && user) {
        const patch: UserUpdateInput = {
          name,
          email: email || undefined,
          phone,
          role,
          branch_id: branchId || null,
          is_active: isActive,
          ...driverFields,
        };
        return users.update(user.id, patch);
      }
      const input: UserCreateInput = {
        name,
        email,
        password,
        phone,
        role,
        branch_id: branchId || null,
        ...driverFields,
      };
      return users.create(input);
    },
    onSuccess: () => {
      toast.success(isEdit ? t('users.manage.updated') : t('users.manage.created'));
      qc.invalidateQueries({ queryKey: ['users-all'] });
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function submit() {
    if (!nameAr && !nameEn) return toast.error(t('users.manage.errors.nameRequired'));
    if (!isEdit) {
      if (!email) return toast.error(t('users.manage.errors.emailRequired'));
      if (password.length < 8) return toast.error(t('users.manage.errors.passwordShort'));
    }
    mutation.mutate();
  }

  return (
    <FeedbackPin elementId="users.editForm">
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
        className="max-w-[640px]"
      >
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('users.manage.editTitle') : t('users.manage.addTitle')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label required>{t('users.form.nameAr')}</Label>
            <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </div>
          <div>
            <Label>{t('users.form.nameEn')}</Label>
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
          </div>

          <div>
            <Label required={!isEdit}>{t('users.form.email')}</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
              disabled={isEdit}
            />
          </div>
          <div>
            <Label required>{t('users.form.phone')}</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </div>

          {!isEdit && (
            <div className="col-span-2">
              <Label required>{t('users.form.password')}</Label>
              <Input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="ltr"
                placeholder={t('users.form.passwordHint')}
              />
            </div>
          )}

          <div>
            <Label required>{t('users.form.role')}</Label>
            <Select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {t(`users.roles.${r}` as const)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>{t('users.form.branch')}</Label>
            <Select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
              <option value="">{t('users.form.noBranch')}</option>
              {(branchList ?? []).map((b) => (
                <option key={b.id} value={b.id}>
                  {pickLocale(b.name, locale)}
                </option>
              ))}
            </Select>
          </div>

          {role === 'driver' && (
            <>
              <div>
                <Label>{t('users.form.driverCode')}</Label>
                <Input value={driverCode} onChange={(e) => setDriverCode(e.target.value)} dir="ltr" />
              </div>
              <div>
                <Label>{t('users.form.vehicleType')}</Label>
                <Select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value as VehicleType | '')}
                >
                  <option value="">—</option>
                  {VEHICLE_TYPES.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </div>
            </>
          )}

          {isEdit && (
            <div>
              <Label>{t('users.columns.status')}</Label>
              <label className="mt-2 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                {isActive ? t('users.status.active') : t('users.status.inactive')}
              </label>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <FeedbackPin elementId="users.editForm.submit">
            <Button variant="primary" size="md" onClick={submit} disabled={mutation.isPending}>
              {mutation.isPending ? t('common.loading') : t('common.save')}
            </Button>
          </FeedbackPin>
        </DialogFooter>
      </Dialog>
    </FeedbackPin>
  );
}
