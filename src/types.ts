export interface Product {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  category: string;
  created_at: string;
  logistics_unit_quantity: number; // Cantidad de unidades de venta por pallet
  sales_unit_quantity: number;     // Cantidad de unidades de consumo por caja
  logistics_unit_stock: number;    // Stock en pallets
  sales_unit_stock: number;        // Stock en cajas sueltas
  consumption_unit_stock: number;  // Stock en unidades sueltas
}

export interface Movement {
  id: string;
  product_id: string;
  type: 'entrada' | 'salida';
  quantity: number;
  unit_type: 'logistics' | 'sales' | 'consumption';
  created_at: string;
}
