export type MakeupProduct = {
  product_key: string;
  name: string;
  brand: string | null;
  category: string | null;

  // ✅ Now you said description is added in DB
  description: string | null;

  // ✅ Public URLs mostly, some null → fallback image
  image_url: string | null;

  // numeric can come as number depending on your supabase config
  price: number | null;
  is_skin_friendly: boolean | null;
  is_active: boolean | null;
  finish: string | null;
};

export type ProductShade = {
  shade_key: string;
  product_key: string;
  shade_name: string;

  // ✅ Real DB field name
  shade_hex: string | null;

 
};
