'use client';

import { useMutation } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';
import { users } from '@/lib/api/users';
import type { User } from '@/lib/types/user';
import { pickLocale } from '@/lib/utils';
import type { Locale } from '@/lib/i18n/config';

/** Set a new password for a staff login (admin only, server-side). */
export function ResetPasswordModal({
  user,
  onClose,
}: {
  user: User | null;
  onClose: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale() as Locale;
  const [password, setPassword] = useState('');

  useEffect(() => {
    setPassword('');
  }, [user]);

  const mutation = useMutation({
    mutationFn: () =>
      user ? users.resetPassword(user.id, password) : Promise.reject(new Error('No user')),
    onSuccess: () => {
      toast.success(t('users.manage.passwordReset'));
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <FeedbackPin elementId="users.resetPasswordForm">
      <Dialog
        open={!!user}
        onOpenChange={(o) => {
          if (!o) onClose();
        }}
        className="max-w-[480px]"
      >
        <DialogHeader>
          <DialogTitle>{t('users.manage.resetPasswordTitle')}</DialogTitle>
        </DialogHeader>
        {user && (
          <p className="mb-2 text-sm text-fg-muted">
            {pickLocale(user.name, locale)} · {user.email ?? '—'}
          </p>
        )}
        <div>
          <Label required>{t('users.form.password')}</Label>
          <Input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
            placeholder={t('users.form.passwordHint')}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" size="md" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={password.length < 8 || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? t('common.loading') : t('users.manage.resetPasswordSubmit')}
          </Button>
        </DialogFooter>
      </Dialog>
    </FeedbackPin>
  );
}
