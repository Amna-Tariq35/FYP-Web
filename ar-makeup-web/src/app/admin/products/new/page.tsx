"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AddProductPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  
  const [product, setProduct] = useState({
    name: "",
    brand: "",
    category: "lipstick",
    price: 0,
    image_url: "",
    description: "",
  });

  const [shades, setShades] = useState<any[]>([]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setProduct({
      ...product,
      name,
    });
  };

  const handleAddShade = () => {
    setShades([
      ...shades,
      {
        temp_id: Date.now().toString(),
        shade_name: "New Shade",
        shade_hex: "#FF0000",
      }
    ]);
  };

  const handleRemoveShade = (temp_id: string) => {
    setShades(shades.filter(s => s.temp_id !== temp_id));
  };

  const handleSave = async () => {
    if (!product.name || !product.brand || product.price <= 0) {
      alert("Please fill in the required fields (Name, Brand, Price).");
      return;
    }

    setSaving(true);
    
    const generatedKey = `${product.brand.toLowerCase().replace(/[^a-z0-9]/g, '')}_${product.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    const formattedShades = shades.map(s => ({
      shade_name: s.shade_name,
      shade_hex: s.shade_hex,
      shade_key: s.shade_name.toLowerCase().replace(/[^a-z0-9]/g, '_')
    }));

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/admin/products/create", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          product: { ...product, product_key: generatedKey },
          initialShades: formattedShades
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Product created successfully!");
        router.push("/admin/products");
      } else {
        alert("Failed to create product: " + data.error);
      }
    } catch (error) {
      alert("Network error while saving.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-main)]">Add New Product</h1>
            <p className="text-sm text-gray-500">Create a new makeup product for your store.</p>
          </div>
        </div>
        
        <button 
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2 rounded-xl text-white font-medium transition-all"
          style={{ background: "var(--rose-primary, #C06C84)" }}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Product"}
        </button>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-[var(--text-main)] border-b pb-2">Basic Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input 
              type="text" 
              value={product.name}
              onChange={handleNameChange}
              placeholder="e.g. SuperStay Matte Ink"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
            <input 
              type="text" 
              value={product.brand}
              onChange={(e) => setProduct({...product, brand: e.target.value})}
              placeholder="e.g. Maybelline"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
            <input 
              type="number" 
              value={product.price}
              onChange={(e) => setProduct({...product, price: parseFloat(e.target.value) || 0})}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL (Optional)</label>
            <input 
              type="text" 
              value={product.image_url}
              onChange={(e) => setProduct({...product, image_url: e.target.value})}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            />
            <p className="text-xs text-gray-500 mt-1">For FYP, you can paste an image link from Google here.</p>
          </div>
        </div>
      </div>

      {/* Initial Shades */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Initial Shades</h2>
          <button 
            onClick={handleAddShade}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-[#C06C84] bg-[#F4C2C2] hover:bg-opacity-80 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Shade
          </button>
        </div>

        <div className="space-y-3 mt-4">
          {shades.map((shade, index) => (
            <div key={shade.temp_id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                <input 
                  type="color" 
                  value={shade.shade_hex}
                  onChange={(e) => {
                    const updated = [...shades];
                    updated[index].shade_hex = e.target.value;
                    setShades(updated);
                  }}
                  className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                />
              </div>
              
              <div className="flex-1 grid grid-cols-2 gap-4">
                <div>
                  <input 
                    type="text" 
                    placeholder="Shade Name (e.g. Ruby Red)"
                    value={shade.shade_name}
                    onChange={(e) => {
                      const updated = [...shades];
                      updated[index].shade_name = e.target.value;
                      setShades(updated);
                    }}
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
                  />
                </div>
                <div>
                  <input 
                    type="text" 
                    value={shade.shade_hex.toUpperCase()}
                    readOnly
                    className="w-full px-3 py-1.5 text-sm font-mono rounded-lg border border-gray-200 bg-white text-gray-500"
                  />
                </div>
              </div>

              <button 
                onClick={() => handleRemoveShade(shade.temp_id)}
                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))}

          {shades.length === 0 && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No shades added yet. You can add them now or later from the Edit page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}