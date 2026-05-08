export interface SavedLook {
  id: string;
  user_id: string;
  look_name: string;
  preview_image_url: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface SavedLookItem {
  id: string;
  look_id: string;
  product_key: string;
  shade_key: string;
  intensity: number;
  layer_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  product_key: string;
  name: string;
  price: number;
  image_url: string;
  category: string;
  brand: string;
}

export interface LookItemWithProduct extends SavedLookItem {
  product: Product;
}