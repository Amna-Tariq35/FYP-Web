"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Palette } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [product, setProduct] = useState<any>(null);
  const [existingShades, setExistingShades] = useState<any[]>([]);
  const [newShades, setNewShades] = useState<any[]>([]);
  const [deletedShadeIds, setDeletedShadeIds] = useState<string[]>([]);

  useEffect(() => {
    if (productId) fetchProductData();
  }, [productId]);

  async function fetchProductData() {
    setLoading(true);
    
    const { data: prodData, error: prodError } = await supabase
      .from("makeup_products")
      .select("*")
      .eq("id", productId)
      .single();

    if (prodData) {
      setProduct(prodData);
      
      const { data: shadeData } = await supabase
        .from("product_shades")
        .select("*")
        .eq("product_key", prodData.product_key)
        .order("shade_order", { ascending: true });
        
      if (shadeData) setExistingShades(shadeData);
    } else {
      console.error("Error fetching product:", prodError);
    }
    setLoading(false);
  }

  const handleAddNewShade = () => {
    setNewShades([
      ...newShades,
      {
        temp_id: Date.now().toString(),
        shade_key: `shade_${Date.now()}`,
        shade_name: "New Shade",
        shade_hex: "#FF0000",
        shade_order: existingShades.length + newShades.length + 1,
      }
    ]);
  };

  const handleDeleteExistingShade = (id: string) => {
    setDeletedShadeIds([...deletedShadeIds, id]);
    setExistingShades(existingShades.filter(s => s.id !== id));
  };

  const handleDeleteNewShade = (temp_id: string) => {
    setNewShades(newShades.filter(s => s.temp_id !== temp_id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/admin/products/update", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          product,
          newShades,
          deletedShadeIds
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Product and shades updated successfully!");
        router.push("/admin/products");
      } else {
        alert("Failed to update: " + data.error);
      }
    } catch (error) {
      alert("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading product details...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Product not found.</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Edit Product</h1>
            <p className="text-sm text-gray-500">Key: {product.product_key}</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-medium transition-all"
          style={{ background: "var(--rose-primary, #C06C84)" }}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Basic Info Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-main)] border-b pb-2">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input 
              type="text" 
              value={product.name}
              onChange={(e) => setProduct({...product, name: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
            <input 
              type="text" 
              value={product.brand}
              onChange={(e) => setProduct({...product, brand: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input 
              type="number" 
              value={product.price}
              onChange={(e) => setProduct({...product, price: parseFloat(e.target.value)})}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
              value={product.category}
              onChange={(e) => setProduct({...product, category: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2] bg-white"
            >
              <option value="lipstick">Lipstick</option>
              <option value="foundation">Foundation</option>
              <option value="blush">Blush</option>
              <option value="eyeshadow">Eyeshadow</option>
              <option value="eyeliner">Eyeliner</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input 
              type="text" 
              value={product.image_url || ""}
              onChange={(e) => setProduct({...product, image_url: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
          </div>
        </div>
      </div>

      {/* Shades Management Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[#C06C84]" />
            <h2 className="text-lg font-bold text-[var(--text-main)]">Shades & Colors</h2>
          </div>
          <button 
            onClick={handleAddNewShade}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[#C06C84] bg-[#F4C2C2] hover:bg-opacity-80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Shade
          </button>
        </div>

        <p className="text-sm text-gray-500">
          These hex codes are used by the AR Engine to render makeup on the user's face.
        </p>

        <div className="space-y-3 mt-4">
          {existingShades.map((shade) => (
            <div key={shade.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <input 
                  type="color" 
                  value={shade.shade_hex} 
                  disabled
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-not-allowed"
                />
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Shade Name</div>
                  <div className="font-medium text-gray-900">{shade.shade_name}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Hex Code</div>
                  <div className="font-mono text-sm text-gray-600">{shade.shade_hex}</div>
                </div>
              </div>

              <button 
                onClick={() => handleDeleteExistingShade(shade.id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove Shade"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {newShades.map((shade, index) => (
            <div key={shade.temp_id} className="flex items-center gap-4 p-3 border border-[#F4C2C2] rounded-xl bg-white shadow-sm">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <input 
                  type="color" 
                  value={shade.shade_hex}
                  onChange={(e) => {
                    const updated = [...newShades];
                    updated[index].shade_hex = e.target.value;
                    setNewShades(updated);
                  }}
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                />
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Shade Name"
                    value={shade.shade_name}
                    onChange={(e) => {
                      const updated = [...newShades];
                      updated[index].shade_name = e.target.value;
                      updated[index].shade_key = e.target.value.toLowerCase().replace(/\s+/g, '_');
                      setNewShades(updated);
                    }}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={shade.shade_hex.toUpperCase()}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-gray-200 bg-gray-50 text-gray-500"
                  />
                </div>
              </div>

              <button 
                onClick={() => handleDeleteNewShade(shade.temp_id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Remove New Shade"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {existingShades.length === 0 && newShades.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No shades available for this product. Click "Add Shade" to create one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}