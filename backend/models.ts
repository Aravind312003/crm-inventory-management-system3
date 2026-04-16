export interface Supplier {
  id?: number;
  supplier_name: string;
  phone_number: string;
  email: string;
  address: string;
  gst_number: string;
}

export interface Product {
  id?: number;
  serial_no: string;
  product_group: string;
  product_name: string;
  supplier_id?: number;
}

export interface Stock {
  id?: number;
  serial_no: string;
  product_id: number;
  product_name: string;
  stock_quantity: number;
  order_date: string;
  volume: number;
  base_price: number;
  has_gst: number; // 0 or 1
  total_price: number;
  price_per_litre: number;
  bill_type: 'Paid' | 'Not Paid';
}

export interface Sale {
  id?: number;
  product_id?: number;
  vendor: string;
  product_name: string;
  bill_type: 'Paid' | 'Not Paid';
  quantity: number;
  delivery_notes: string;
  amount_status: string;
  payment_received_date: string;
  amount: number; // This is the base price from stock
  other_price: number;
  total_price: number;
  volume: number;
}
