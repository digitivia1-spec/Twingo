import type { UserRole, VehicleType } from './enums';
import type { AuditFields, Bilingual, SoftDelete } from './shared';

export interface User extends AuditFields, SoftDelete {
  id: string;
  name: Bilingual;
  phone: string;
  email?: string;
  role: UserRole;
  branch_id?: string;
  is_active: boolean;
  // Driver-specific
  driver_code?: string;
  vehicle_type?: VehicleType;
  national_id?: string;
  license_number?: string;
}
