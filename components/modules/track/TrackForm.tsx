'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { FeedbackPin } from '@/components/feedback/FeedbackPin';

/**
 * Operator-facing tracking entry form. Lives in the dashboard layout.
 * The same lookup is exposed publicly via /t/[code] (no chrome).
 */
export function TrackForm() {
  const t = useTranslations('track');
  const router = useRouter();
  const [code, setCode] = useState('');

  function go(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  }

  return (
    <>
      <PageHeader
        elementId="track"
        title={t('title')}
        subtitle={t('subtitle')}
      />
      <FeedbackPin elementId="track.form">
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-4 w-4 text-primary-700" />
              {t('title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={go} className="flex items-center gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={t('placeholder')}
                className="flex-1 font-mono"
                aria-label={t('placeholder')}
                autoFocus
              />
              <Button type="submit">
                <Search className="h-3.5 w-3.5" />
                {t('submit')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </FeedbackPin>
    </>
  );
}
