import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import {
  COD_STATUS_TONE,
  FINANCE_STATUS_TONE,
  ORDER_STATUS_TONE,
  STOCK_STATUS_TONE,
} from '@/lib/constants/statuses';
import type {
  CodStatus,
  FinanceStatus,
  OrderStatus,
  StockStatus,
} from '@/lib/types/enums';

type Kind =
  | { kind: 'order'; status: OrderStatus }
  | { kind: 'stock'; status: StockStatus }
  | { kind: 'finance'; status: FinanceStatus }
  | { kind: 'cod'; status: CodStatus };

export function StatusBadge(props: Kind) {
  const t = useTranslations('statuses');
  const { kind, status } = props;
  let tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  let label: string;
  switch (kind) {
    case 'order':
      tone = ORDER_STATUS_TONE[status];
      label = t(`order.${status}` as const);
      break;
    case 'stock':
      tone = STOCK_STATUS_TONE[status];
      label = t(`stock.${status}` as const);
      break;
    case 'finance':
      tone = FINANCE_STATUS_TONE[status];
      label = t(`finance.${status}` as const);
      break;
    case 'cod':
      tone = COD_STATUS_TONE[status];
      label = t(`cod.${status}` as const);
      break;
  }
  return <Badge tone={tone}>{label}</Badge>;
}
