import type {
  CodStatus,
  FinanceStatus,
  OrderStatus,
  StockStatus,
} from '@/lib/types/enums';

type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export const ORDER_STATUS_TONE: Record<OrderStatus, Tone> = {
  pending: 'warning',
  dispatched: 'info',
  out_for_delivery: 'info',
  delivered: 'success',
  partially_delivered: 'warning',
  returned: 'warning',
  cancelled: 'neutral',
  refused: 'danger',
};

export const STOCK_STATUS_TONE: Record<StockStatus, Tone> = {
  available: 'success',
  locked: 'danger',
  in_transit: 'info',
  reserved: 'warning',
};

export const FINANCE_STATUS_TONE: Record<FinanceStatus, Tone> = {
  pending: 'warning',
  reconciled: 'info',
  approved: 'info',
  paid_out: 'success',
  disputed: 'danger',
};

export const COD_STATUS_TONE: Record<CodStatus, Tone> = {
  pending: 'warning',
  scheduled: 'info',
  paid: 'success',
  disputed: 'danger',
};
