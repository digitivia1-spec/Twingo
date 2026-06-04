/**
 * Per-tab guided explanations. Rendered by <PageGuide/> on every dashboard
 * page (via PageShell). Bilingual (AR default / EN). Keyed by the leading
 * path segment(s); more specific keys must come first.
 */
export interface GuideEntry {
  title: string;
  body: string;
  steps: string[];
}
export interface Guide {
  ar: GuideEntry;
  en: GuideEntry;
}

// Ordered: most specific path first.
const GUIDES: Array<{ key: string; guide: Guide }> = [
  {
    key: 'pickup/new',
    guide: {
      ar: {
        title: 'إنشاء شحنة جديدة',
        body: 'سجّل شحنة جديدة يدويًا — بيانات المستلم والعنوان والتحصيل (COD) ورسوم الشحن.',
        steps: [
          'اختر العميل والفرع التابع له.',
          'أدخل اسم المستلم وهاتفه وعنوان التسليم بالكامل.',
          'حدّد قيمة التحصيل ووزن الشحنة ثم احفظ — سيظهر كود الشحنة فورًا.',
        ],
      },
      en: {
        title: 'Create a new shipment',
        body: 'Register a shipment manually — recipient, address, COD amount and shipping fee.',
        steps: [
          'Pick the client and its branch.',
          'Enter recipient name, phone and full delivery address.',
          'Set the COD value and weight, then save — the shipment code appears immediately.',
        ],
      },
    },
  },
  {
    key: 'pickup/import',
    guide: {
      ar: {
        title: 'استيراد الشحنات',
        body: 'ارفع ملف Excel أو CSV بشحناتك الفعلية لإنشائها دفعة واحدة بدل إدخالها يدويًا.',
        steps: [
          'حمّل القالب لمعرفة أسماء الأعمدة المطلوبة.',
          'اسحب ملف الإكسل/‏CSV إلى المنطقة المخصصة.',
          'راجع المعاينة ثم اضغط "استيراد" — الصفوف الصحيحة تُنشأ كشحنات.',
        ],
      },
      en: {
        title: 'Import shipments',
        body: 'Upload an Excel or CSV file of your real shipments to create them in bulk instead of typing each one.',
        steps: [
          'Download the template to see the required column names.',
          'Drag your Excel/CSV file onto the drop area.',
          'Review the preview, then click Import — valid rows become shipments.',
        ],
      },
    },
  },
  {
    key: 'clients/pending',
    guide: {
      ar: {
        title: 'العملاء قيد الاعتماد',
        body: 'التجار الذين سجّلوا حديثًا وينتظرون الموافقة قبل تفعيل حساباتهم.',
        steps: [
          'افتح ملف التاجر وراجع بياناته.',
          'اضغط "اعتماد" لتفعيله، أو "رفض" مع كتابة السبب.',
          'بعد الاعتماد يظهر التاجر في دليل العملاء ويمكنه استلام الشحنات.',
        ],
      },
      en: {
        title: 'Pending clients',
        body: 'Newly registered merchants awaiting approval before their accounts go live.',
        steps: [
          'Open a merchant and review the details.',
          'Click Approve to activate, or Reject with a reason.',
          'Approved merchants appear in the client directory and can receive shipments.',
        ],
      },
    },
  },
  {
    key: 'pickup',
    guide: {
      ar: {
        title: 'الشحنات',
        body: 'القائمة الرئيسية لكل الشحنات. فلتر بالحالة والفرع والتاريخ، وافتح أي شحنة لتغيير حالتها أو تعيين مندوب.',
        steps: [
          'استخدم الفلاتر أعلى الجدول لتضييق النتائج.',
          'اضغط على شحنة لعرض تفاصيلها وسجل حالاتها.',
          'من التفاصيل يمكنك الإرسال (تعيين مندوب)، تغيير الحالة، أو الإلغاء.',
        ],
      },
      en: {
        title: 'Shipments',
        body: 'The master list of all shipments. Filter by status, branch and date, and open any shipment to change status or assign a driver.',
        steps: [
          'Use the filters above the table to narrow results.',
          'Click a shipment to see its details and status history.',
          'From details you can dispatch (assign a driver), change status, or cancel.',
        ],
      },
    },
  },
  {
    key: 'new-orders',
    guide: {
      ar: {
        title: 'الطلبات الجديدة',
        body: 'الشحنات الواردة من بوابة التجار أو الاستيراد والتي تنتظر مراجعة العمليات قبل التشغيل.',
        steps: [
          'راجع تفاصيل كل طلب وارد.',
          'اضغط "اعتماد" ليصبح قابلًا للإرسال، أو "رفض" مع السبب.',
          'الطلبات المعتمدة تنتقل تلقائيًا إلى قائمة الشحنات الرئيسية.',
        ],
      },
      en: {
        title: 'New orders',
        body: 'Shipments submitted via the merchant portal or imports, waiting for ops review before going live.',
        steps: [
          'Review each incoming order.',
          'Click Approve to make it dispatchable, or Reject with a reason.',
          'Approved orders move automatically into the main shipments list.',
        ],
      },
    },
  },
  {
    key: 'cash-requests',
    guide: {
      ar: {
        title: 'طلبات السحب النقدي',
        body: 'طلبات التجار لسحب أرصدتهم المحصّلة. تتبع المسار: قيد الانتظار ← معتمد ← مدفوع.',
        steps: [
          'افتح الطلب وتأكد من الرصيد المتاح.',
          'اعتمد الطلب أو ارفضه.',
          'بعد الاعتماد سجّل الدفع مع رقم الحوالة/المرجع.',
        ],
      },
      en: {
        title: 'Cash requests',
        body: "Merchant requests to withdraw their collected balance. Flow: pending → approved → paid.",
        steps: [
          'Open a request and confirm the available balance.',
          'Approve or reject it.',
          'After approval, mark it paid with the transfer reference.',
        ],
      },
    },
  },
  {
    key: 'clients',
    guide: {
      ar: {
        title: 'العملاء (التجار)',
        body: 'دليل التجار المعتمدين: بياناتهم، فرعهم، شروط الدفع، وإجمالي المستحقات.',
        steps: [
          'ابحث بالاسم أو رقم الهاتف.',
          'افتح أي تاجر لعرض ملفه وشحناته ومستحقاته.',
          'استخدم "العملاء قيد الاعتماد" لإضافة تجار جدد.',
        ],
      },
      en: {
        title: 'Clients (merchants)',
        body: 'Directory of approved merchants: details, branch, payment terms and total dues.',
        steps: [
          'Search by name or phone number.',
          'Open a merchant to see their profile, shipments and dues.',
          'Use Pending Clients to onboard new merchants.',
        ],
      },
    },
  },
  {
    key: 'drivers',
    guide: {
      ar: {
        title: 'المندوبون',
        body: 'قائمة مندوبي التوصيل، نوع المركبة، والفرع التابعين له.',
        steps: ['تصفّح المندوبين حسب الفرع.', 'راجع نوع المركبة وحالة النشاط.', 'تُستخدم بياناتهم عند إرسال الشحنات.'],
      },
      en: {
        title: 'Drivers',
        body: 'Your delivery drivers, their vehicle type and branch.',
        steps: ['Browse drivers by branch.', 'Check vehicle type and active status.', 'They are selectable when dispatching shipments.'],
      },
    },
  },
  {
    key: 'users',
    guide: {
      ar: {
        title: 'المستخدمون والصلاحيات',
        body: 'موظفو الشركة وأدوارهم (مدير عام/مدير/مخزن/مندوب/مالية). الدور يحدد ما يمكن لكل مستخدم رؤيته وتعديله.',
        steps: [
          'تصفّح المستخدمين حسب الدور أو الفرع.',
          'كل دور له صلاحيات مختلفة مطبّقة على مستوى قاعدة البيانات (RLS).',
          'المدير العام والمدير يمكنهم إدارة المستخدمين.',
        ],
      },
      en: {
        title: 'Users & permissions',
        body: 'Company staff and their roles (super_admin/manager/warehouse/driver/finance). The role decides what each user can see and edit.',
        steps: [
          'Browse users by role or branch.',
          'Each role has different permissions enforced at the database level (RLS).',
          'Super-admins and managers can manage users.',
        ],
      },
    },
  },
  {
    key: 'finance',
    guide: {
      ar: {
        title: 'التسويات المالية',
        body: 'تسوية ورديات المندوبين: المتوقع مقابل المُحصّل فعليًا، مع مسار اعتماد مزدوج.',
        steps: ['راجع وردية المندوب وأدخل النقدية الفعلية.', 'اعتمد الوردية (يجب أن يختلف المعتمد عن المُسوّي).', 'صرف المستحق وسجّله.'],
      },
      en: {
        title: 'Finance reconciliation',
        body: 'Reconcile driver shifts: expected vs actually collected cash, with dual-control approval.',
        steps: ['Review a shift and enter the actual cash.', 'Approve it (approver must differ from reconciler).', 'Pay out and record it.'],
      },
    },
  },
  {
    key: 'cod',
    guide: {
      ar: {
        title: 'مستحقات التحصيل (COD)',
        body: 'المبالغ المحصّلة من العملاء والمستحقة للتجار بعد خصم رسوم الشحن.',
        steps: ['افتح مستحقًا لمعرفة الشحنات المكوّنة له.', 'جدوِل الدفع أو اصرفه.', 'يمكن إرسال إشعار واتساب للتاجر عند الصرف.'],
      },
      en: {
        title: 'COD dues',
        body: 'Amounts collected from customers and owed to merchants after shipping fees.',
        steps: ['Open a due to see its source shipments.', 'Schedule a payout or pay it out.', 'A WhatsApp notice can be sent to the merchant on payout.'],
      },
    },
  },
  {
    key: 'branches',
    guide: {
      ar: {
        title: 'الفروع',
        body: 'فروع التشغيل ومناطق التغطية والمدير المسؤول عن كل فرع.',
        steps: ['تصفّح الفروع وبياناتها.', 'راجع المحافظات التي يغطيها كل فرع.', 'المدير يرى ويُدير بيانات فرعه فقط.'],
      },
      en: {
        title: 'Branches',
        body: 'Operating branches, their coverage areas and the responsible manager.',
        steps: ['Browse branches and their details.', 'Check which governorates each branch covers.', 'A manager sees and manages only their own branch.'],
      },
    },
  },
  {
    key: 'stock',
    guide: {
      ar: {
        title: 'المخزون',
        body: 'أصناف المخزون في كل فرع وحركاتها (استلام/صرف/تحويل/قفل).',
        steps: ['فلتر حسب الفرع والحالة.', 'حوّل صنفًا بين الفروع أو افتح/اقفل صنفًا.', 'كل حركة تُسجَّل في سجل الحركات.'],
      },
      en: {
        title: 'Stock',
        body: 'Inventory items per branch and their movements (intake/outbound/transfer/lock).',
        steps: ['Filter by branch and status.', 'Transfer an item between branches, or lock/unlock it.', 'Every action is recorded in the movements log.'],
      },
    },
  },
  {
    key: 'prices',
    guide: {
      ar: {
        title: 'قائمة الأسعار',
        body: 'الأسعار الافتراضية للشحن بين المحافظات حسب شريحة الوزن.',
        steps: ['ابحث عن مسار (من ← إلى).', 'راجع السعر حسب الوزن ورسوم التحصيل.', 'الأسعار الخاصة بتاجر معيّن تُدار من "أسعار العملاء".'],
      },
      en: {
        title: 'Price list',
        body: 'Default shipping prices between governorates by weight tier.',
        steps: ['Find a lane (from → to).', 'Check the price by weight and COD handling fee.', 'Per-merchant overrides live under Client rates.'],
      },
    },
  },
  {
    key: 'rates',
    guide: {
      ar: {
        title: 'أسعار العملاء',
        body: 'أسعار خاصة تتجاوز قائمة الأسعار العامة لتاجر معيّن على مسار محدد.',
        steps: ['اختر التاجر.', 'راجع/فعّل السعر الخاص بكل مسار.', 'له الأولوية على السعر العام عند الحساب.'],
      },
      en: {
        title: 'Client rates',
        body: 'Per-merchant prices that override the global price list on a specific lane.',
        steps: ['Pick the merchant.', 'Review/activate the rate per lane.', 'It takes priority over the global price at calculation time.'],
      },
    },
  },
  {
    key: 'awb-codes',
    guide: {
      ar: {
        title: 'أرقام البوالص (AWB)',
        body: 'مجمّع أرقام الشحن لكل فرع: متاح / محجوز / مستخدم / ملغي.',
        steps: ['ولّد دفعة جديدة من الأرقام للفرع.', 'احجز رقمًا لشحنة، أو ألغِ رقمًا به خطأ.', 'الأرقام المستخدمة لا يمكن إلغاؤها.'],
      },
      en: {
        title: 'AWB codes',
        body: 'Waybill-number pool per branch: available / reserved / used / voided.',
        steps: ['Generate a fresh batch for a branch.', 'Reserve a number for a shipment, or void a faulty one.', 'Used numbers cannot be voided.'],
      },
    },
  },
  {
    key: 'returns',
    guide: {
      ar: {
        title: 'المرتجعات',
        body: 'كشوف إرجاع البضائع للتجار وحالتها حتى الاستلام بالتوقيع.',
        steps: ['افتح كشف المرتجع لعرض شحناته.', 'تابع الحالة: مسودة ← في الطريق ← تم التسليم ← مُستلم.', 'سجّل توقيع الاستلام عند التسليم للتاجر.'],
      },
      en: {
        title: 'Returns',
        body: 'Return manifests of goods going back to merchants, tracked to signed receipt.',
        steps: ['Open a manifest to see its shipments.', 'Track status: draft → in transit → delivered → acknowledged.', 'Capture the signature on merchant receipt.'],
      },
    },
  },
  {
    key: 'reports',
    guide: {
      ar: {
        title: 'التقارير',
        body: 'تقارير تشغيلية ومالية: الطلبات، الدخل، أداء المندوبين، والحركة عبر الزمن.',
        steps: ['اختر التقرير المناسب.', 'حدّد نطاق التاريخ والفرع.', 'صدّر أو اطبع النتائج عند الحاجة.'],
      },
      en: {
        title: 'Reports',
        body: 'Operational and financial reports: orders, income, driver performance and activity over time.',
        steps: ['Pick the relevant report.', 'Set the date range and branch.', 'Export or print the results as needed.'],
      },
    },
  },
  {
    key: 'provinces',
    guide: {
      ar: {
        title: 'المحافظات',
        body: 'قائمة المحافظات وحالة تفعيلها للتغطية والتسعير.',
        steps: ['فعّل/عطّل محافظة.', 'تؤثر على خيارات العناوين والأسعار.', ''],
      },
      en: {
        title: 'Governorates',
        body: 'The list of governorates and whether they are active for coverage and pricing.',
        steps: ['Toggle a governorate active/inactive.', 'Affects address and price options.', ''],
      },
    },
  },
  {
    key: 'cities',
    guide: {
      ar: { title: 'المدن', body: 'المدن داخل كل محافظة لتنظيم العناوين.', steps: ['فلتر حسب المحافظة.', 'ابحث بالاسم أو الكود.', ''] },
      en: { title: 'Cities', body: 'Cities within each governorate, used to structure addresses.', steps: ['Filter by governorate.', 'Search by name or code.', ''] },
    },
  },
  {
    key: 'districts',
    guide: {
      ar: { title: 'الأحياء', body: 'الأحياء داخل كل مدينة لدقة العناوين والتغطية.', steps: ['فلتر حسب المدينة.', 'ابحث بالاسم أو الكود.', ''] },
      en: { title: 'Districts', body: 'Districts within each city for address precision and coverage.', steps: ['Filter by city.', 'Search by name or code.', ''] },
    },
  },
  {
    key: 'zones',
    guide: {
      ar: { title: 'المناطق', body: 'مناطق التغطية التي تجمع محافظات وفروعًا لتسعير المسارات وتوزيع المندوبين.', steps: ['فلتر حسب الفرع أو المحافظة.', 'راجع المحافظات المشمولة.', ''] },
      en: { title: 'Zones', body: 'Coverage zones grouping governorates and branches for lane pricing and driver routing.', steps: ['Filter by branch or governorate.', 'Review the included governorates.', ''] },
    },
  },
  {
    key: 'settings/statuses',
    guide: {
      ar: { title: 'تصنيف الحالات', body: 'مرجع حالات الشحنات وأكواد الأسباب المستخدمة عند تغيير الحالة.', steps: ['راجع الحالات المتاحة.', 'تُستخدم في شاشة تغيير حالة الشحنة.', ''] },
      en: { title: 'Status taxonomy', body: 'Reference of shipment statuses and the reason codes used when changing status.', steps: ['Review the available statuses.', 'Used by the shipment status-change modal.', ''] },
    },
  },
  {
    key: 'track',
    guide: {
      ar: { title: 'التتبع', body: 'تتبّع شحنة بكود الشحنة لعرض حالتها وسجل تحركاتها.', steps: ['أدخل كود الشحنة.', 'اعرض الحالة الحالية والسجل.', ''] },
      en: { title: 'Tracking', body: 'Track a shipment by its code to see status and movement history.', steps: ['Enter the shipment code.', 'View current status and history.', ''] },
    },
  },
  {
    key: '',
    guide: {
      ar: {
        title: 'لوحة التحكم',
        body: 'نظرة عامة على أداء الشركة: الشحنات، التحصيلات، والمؤشرات الرئيسية.',
        steps: ['راجع المؤشرات أعلى الصفحة.', 'استخدم القائمة الجانبية للتنقل بين الوحدات.', 'كل صفحة بها زر "؟" بشرح موجز.'],
      },
      en: {
        title: 'Dashboard',
        body: 'A company-wide overview: shipments, collections and key metrics.',
        steps: ['Review the KPIs at the top.', 'Use the sidebar to move between modules.', 'Every page has a "?" button with a short explanation.'],
      },
    },
  },
];

/** Normalize a localized pathname to its meaningful segments (drop /en, /). */
function normalize(pathname: string): string {
  let p = pathname.replace(/^\/(en|ar)(?=\/|$)/, '');
  p = p.replace(/^\/+|\/+$/g, '');
  return p;
}

export function getGuide(pathname: string, locale: string): GuideEntry | null {
  const p = normalize(pathname);
  const match = GUIDES.find((g) => (g.key === '' ? p === '' : p === g.key || p.startsWith(`${g.key}/`)));
  if (!match) return null;
  return locale === 'en' ? match.guide.en : match.guide.ar;
}
