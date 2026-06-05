/**
 * Steps for the interactive guided tour. Each step optionally anchors to a
 * DOM element (matched via the `data-feedback-id` attributes the app already
 * emits) and optionally navigates to a route before highlighting. When the
 * anchor is missing the tour engine falls back to a centered card, so the
 * walkthrough never dead-ends.
 *
 * Content is bilingual and resolved at render via getTourSteps(locale).
 */
import type { Locale } from '@/lib/i18n/config';

type Bi = { ar: string; en: string };

interface RawStep {
  /** CSS selector for the highlight target (usually [data-feedback-id="…"]). */
  selector?: string;
  /** Locale-agnostic route to navigate to before showing the step. */
  href?: string;
  title: Bi;
  body: Bi;
}

export interface TourStep {
  selector?: string;
  href?: string;
  title: string;
  body: string;
}

const STEPS: RawStep[] = [
  {
    href: '/',
    title: { ar: 'مرحباً بك في توينجو 👋', en: 'Welcome to Twingo 👋' },
    body: {
      ar: 'جولة سريعة تأخذك خلال رحلة الطلب: من لوحة التحكم، لإنشاء أو استيراد بوليصة، للإرسال، لاعتماد الطلبات الجديدة، ثم التحصيل والمالية. استخدم «التالي» و«السابق».',
      en: 'A quick walkthrough of an order’s journey: dashboard → create/import a pickup → dispatch → approve new orders → COD & finance. Use Next / Back to move.',
    },
  },
  {
    href: '/',
    selector: '[data-feedback-id="nav.dashboard"]',
    title: { ar: 'لوحة التحكم', en: 'Dashboard' },
    body: {
      ar: 'نظرة عامة على المؤشرات اليومية — الطلبات، التحصيل، والمندوبين. ابدأ يومك من هنا.',
      en: 'Your daily snapshot — orders, COD, and drivers. Start your day here.',
    },
  },
  {
    href: '/pickup',
    selector: '[data-feedback-id="nav.pickup"]',
    title: { ar: 'البوليصات', en: 'Pickups' },
    body: {
      ar: 'كل الشحنات تُدار من هنا. تابع الحالات، ابحث، وافتح أي بوليصة لعرض تفاصيلها وسجل حالتها.',
      en: 'All shipments live here. Track statuses, search, and open any pickup to see its detail and status history.',
    },
  },
  {
    href: '/pickup',
    selector: '[data-feedback-id="pickup.header.addNew"]',
    title: { ar: 'إنشاء بوليصة', en: 'Create a pickup' },
    body: {
      ar: 'أنشئ شحنة جديدة يدوياً: بيانات المستلم، العنوان، والتحصيل.',
      en: 'Create a new shipment manually: recipient, address, and COD details.',
    },
  },
  {
    href: '/pickup',
    selector: '[data-feedback-id="pickup.header.import"]',
    title: { ar: 'استيراد بالجملة', en: 'Bulk import' },
    body: {
      ar: 'لديك بيانات كثيرة؟ ارفع ملف Excel أو CSV. يتم التحقق محلياً وعرض معاينة قبل الإنشاء — والعميل/الفرع/المحافظة يُطابَقون بالاسم.',
      en: 'Lots of orders? Upload an Excel or CSV file. It validates locally and previews before creating — client, branch and governorate are matched by name.',
    },
  },
  {
    href: '/pickup',
    selector: '[data-feedback-id="pickup.header"]',
    title: { ar: 'الإرسال للمندوب', en: 'Dispatch to a driver' },
    body: {
      ar: 'افتح أي بوليصة قيد الانتظار ثم اضغط «إرسال» لتعيين مندوب ومركبة. تُسجَّل الخطوة في سجل الحالة تلقائياً.',
      en: 'Open any pending pickup and hit Dispatch to assign a driver and vehicle. The action is recorded in the status history automatically.',
    },
  },
  {
    href: '/new-orders',
    selector: '[data-feedback-id="nav.newOrders"]',
    title: { ar: 'اعتماد الطلبات الجديدة', en: 'Approve new orders' },
    body: {
      ar: 'الطلبات الواردة من التجار تنتظر المراجعة هنا. اعتمد أو ارفض — ويُحفظ من قام بالإجراء ضمن السجل.',
      en: 'Merchant-submitted orders wait for review here. Approve or reject — and the actor is saved in the history.',
    },
  },
  {
    href: '/cod',
    selector: '[data-feedback-id="nav.cod"]',
    title: { ar: 'التحصيل والمالية', en: 'COD & finance' },
    body: {
      ar: 'تابع مستحقات التجار، جدول مواعيد السداد، وادفع — مع إشعار واتساب اختياري. وطلبات النقدية والتسويات في صفحات المالية.',
      en: 'Track merchant balances, schedule payout dates, and pay out — with an optional WhatsApp notice. Cash requests and reconciliation live in the finance pages.',
    },
  },
  {
    selector: '[data-feedback-id="topbar.notifications"]',
    title: { ar: 'الإشعارات', en: 'Notifications' },
    body: {
      ar: 'الجرس بالأعلى يجمع كل ما يحتاج إجراءً وآخر النشاط عبر كل القوائم — لمتابعة أي طلب عبر دورة حياته.',
      en: 'The bell up top gathers everything that needs action plus recent activity across all queues — so you can follow any request through its lifecycle.',
    },
  },
  {
    title: { ar: 'انتهت الجولة 🎉', en: 'That’s the tour 🎉' },
    body: {
      ar: 'كل صفحة بها بطاقة «شرح الصفحة» لتفاصيل أكثر، ويمكنك إعادة الجولة في أي وقت من القائمة الجانبية.',
      en: 'Every page has a “Page guide” card for more detail, and you can replay this tour anytime from the sidebar.',
    },
  },
];

export function getTourSteps(locale: Locale): TourStep[] {
  const isAr = locale !== 'en';
  return STEPS.map((s) => ({
    selector: s.selector,
    href: s.href,
    title: isAr ? s.title.ar : s.title.en,
    body: isAr ? s.body.ar : s.body.en,
  }));
}
