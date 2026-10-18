/** Public warehouse summary returned by GET /warehouses. */
export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isActive: boolean;
}

export interface WarehousesResponse {
  items: Warehouse[];
}
