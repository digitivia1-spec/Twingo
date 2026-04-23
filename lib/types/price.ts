export interface PriceListEntry {
  id: string;
  from_governorate_id: string;
  to_governorate_id: string;
  weight_tier: {
    min_kg: number;
    max_kg: number;
  };
  /** piasters */
  base_price: number;
  cod_handling_fee_percent?: number;
  /** piasters */
  fragile_surcharge?: number;
  is_active: boolean;
}
