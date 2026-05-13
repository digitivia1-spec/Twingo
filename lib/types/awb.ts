import type { AwbStatus } from './enums';
import type { AuditFields } from './shared';

/**
 * A single waybill code in the pool. Sequential within a branch; the
 * full printable code is `{branch.code}-{seq}` (e.g. HQ-100012).
 *
 * Lifecycle: available → reserved → used (or voided from any non-used state).
 */
export interface AwbCode extends AuditFields {
  id: string;
  /** Full printable code (e.g. HQ-100012). Branch prefix + sequence. */
  code: string;
  /** Numeric sequence component for sorting within branch. */
  sequence: number;
  branch_id: string;
  status: AwbStatus;

  /** Set when status === 'reserved'. */
  reserved_for_pickup_id?: string;
  reserved_at?: string;
  reserved_by?: string;

  /** Set when status === 'used'. */
  used_for_pickup_id?: string;
  used_at?: string;

  /** Set when status === 'voided'. */
  voided_at?: string;
  voided_by?: string;
  voided_reason?: string;

  /** Cross-batch tracing. */
  batch_id: string;
  generated_by: string;
}

/**
 * A batch event describing how a range of AWB codes was minted.
 * Used for audit and to enable "regenerate this batch" undo.
 */
export interface AwbBatch extends AuditFields {
  id: string;
  branch_id: string;
  count: number;
  from_sequence: number;
  to_sequence: number;
  generated_by: string;
}
