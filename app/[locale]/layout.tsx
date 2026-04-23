import '@/app/globals.css';
import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { cairo, inter } from '@/app/fonts';
import { isLocale, localeDirs, locales } from '@/lib/i18n/config';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { FeedbackBootstrap } from '@/components/feedback/FeedbackBootstrap';
import { FeedbackRibbon } from '@/components/feedback/FeedbackRibbon';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Twinjo ERP — توينجو',
  description: 'Twinjo Logistics ERP — نظام الشحن والتوصيل',
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();
  const dir = localeDirs[locale];

  return (
    <html
      lang={locale}
      dir={dir}
      className={cn(cairo.variable, inter.variable)}
      suppressHydrationWarning
    >
      <body className="bg-bg text-fg antialiased">
        <NextIntlClientProvider messages={messages} locale={locale}>
          <QueryProvider>
            {children}
            <Toaster
              position={dir === 'rtl' ? 'bottom-right' : 'bottom-left'}
              duration={3000}
              richColors
              closeButton
            />
            <FeedbackBootstrap />
            <FeedbackRibbon />
          </QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
