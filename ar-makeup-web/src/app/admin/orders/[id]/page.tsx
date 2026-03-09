"use client";

import React from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, MapPin, Package, CreditCard } from "lucide-react";

import {supabase} from "@/src/lib/supabase/client";
import useSWR from "swr";



// SWR ke liye Custom Fetcher
const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error("No active session");
  
  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${session.access_token}` }
  });
  
  if (!res.ok) throw new Error("Failed to fetch data");
  return res.json();
};

export default function AdminOrderDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  // SWR Hook - Data caching aur fast loading ke liye
  const { data, error, isLoading } = useSWR(
    orderId ? `/api/admin/orders/${orderId}` : null, 
    fetcher,
    { revalidateOnFocus: false }
  );

  const order = data?.order;
  const items = data?.items || [];

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading order details...</div>;
  if (error || !order) return <div className="p-8 text-center text-red-500">Order not found or access denied.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-main)]">Order Details</h1>
          <p className="text-sm text-gray-500 font-mono">ID: {order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <Package className="w-5 h-5 text-[#C06C84]" />
              <h2 className="text-lg font-bold text-[var(--text-main)]">Purchased Items</h2>
            </div>
            
            <div className="space-y-4">
              {items.map((item: any) => (
                <div key={item.id} className="flex items-center gap-4 p-3 border border-gray-100 rounded-xl bg-gray-50">
                  <img 
                    src={item.image_url || "https://picsum.photos/seed/makeup/100/100"} 
                    alt={item.name} 
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-[var(--text-main)]">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.brand}</div>
                    {item.shade_name && (
                      <div className="mt-1 text-xs font-medium text-[#C06C84] bg-[#F4C2C2] inline-block px-2 py-0.5 rounded-md">
                        Shade: {item.shade_name}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-[var(--text-main)]">${item.unit_price}</div>
                    <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                    <div className="font-bold text-[#C06C84] mt-1">${item.line_total}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Customer & Payment Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <MapPin className="w-5 h-5 text-[#C06C84]" />
              <h2 className="text-lg font-bold text-[var(--text-main)]">Shipping Info</h2>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="font-semibold text-gray-900">{order.shipping_name}</div>
              <div>{order.shipping_phone}</div>
              <div>{order.guest_email || "No email provided"}</div>
              <div className="mt-2 text-gray-500">
                {order.shipping_address}<br/>
                {order.shipping_city}, {order.shipping_country}
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4 border-b pb-2">
              <CreditCard className="w-5 h-5 text-[#C06C84]" />
              <h2 className="text-lg font-bold text-[var(--text-main)]">Payment Summary</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>${order.subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping Fee</span>
                <span>${order.shipping_fee}</span>
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg text-[var(--text-main)]">
                <span>Total</span>
                <span className="text-[#C06C84]">${order.total} {order.currency}</span>
              </div>
              <div className="mt-4 pt-4 border-t">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Current Status</span>
                <div className="mt-1 font-semibold text-gray-900 capitalize">{order.status}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}