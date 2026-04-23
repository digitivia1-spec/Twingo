import type { ReturnStatus } from './enums';
import type { AuditFields } from './shared';

export interface ReturnManifest extends AuditFields {
  id: string;
  code: string;
  client_id: string;
  branch_id: string;
  pickup_ids: string[];

  status: ReturnStatus;
  expected_delivery_date?: string;
  delivered_at?: string;
  acknowledged_at?: string;
  acknowledged_by_signature?: string;

  total_pieces: number;
  /** piasters */
  total_value: number;

  notes?: string;
}
