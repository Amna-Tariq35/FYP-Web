import { supabase } from "@/src/lib/supabase/client";
import { MakeupProduct, ProductShade } from "@/src/types/catalog";

export async function getProducts(): Promise<MakeupProduct[]> {
  const { data, error } = await supabase
    .from("makeup_products")
    .select("product_key,name,brand,category,description,image_url,price")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as MakeupProduct[];
}

export async function getProductByKey(product_key: string): Promise<MakeupProduct | null> {
  const { data, error } = await supabase
    .from("makeup_products")
    .select("product_key,name,brand,category,description,image_url,price")
    .eq("product_key", product_key)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data ?? null) as MakeupProduct | null;
}

export async function getShadesByProductKey(product_key: string): Promise<ProductShade[]> {
  const { data, error } = await supabase
    .from("product_shades")
    .select("shade_key,product_key,shade_name,shade_hex")
    .eq("product_key", product_key)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProductShade[];
}
