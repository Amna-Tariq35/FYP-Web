"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Eye, Filter } from "lucide-react";

import useSWR from "swr";
import {supabase} from "@/src/lib/supabase/client";


const STATUS_OPTIONS = ["placed", "paid", "processing", "shipped", "delivered", "cancelled", "failed"];

// SWR ke liye Custom Fetcher (Yeh automatically token attach karega)
const fetcher = async (url: string) => {
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error("Session Error:", sessionError);
      throw new Error("Session fetch failed");
    }
    
    if (!session?.access_token) {
      console.error("No active session found!");
      throw new Error("No active session");
    }
    
    const res = await fetch(url, {
      headers: { "Authorization": `Bearer ${session.access_token}` }
    });
    
    if (!res.ok) {
      // Backend ne kya error bheja hai wo print karein
      const errorText = await res.text();
      console.error(`API Error (${res.status}):`, errorText);
      throw new Error(`API Error: ${res.status}`);
    }
    
    return await res.json();
  } catch (err) {
    console.error("Fetcher Error:", err);
    throw err;
  }
};
export default function AdminOrdersPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // SWR Hook - Caching, Revalidation aur Fast Fetching ke liye
  const { data, error, isLoading, mutate } = useSWR("/api/admin/orders", fetcher, {
    revalidateOnFocus: false, // Window focus par bar bar fetch na kare
    shouldRetryOnError: true, // Agar token na mile toh retry kare
  });

  const orders = data?.orders || [];

  async function handleStatusChange(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        alert("Session expired. Please login again.");
        return;
      }

      // Optimistic UI Update (API call se pehle UI update kar dein taake fast feel ho)
      mutate({ ...data, orders: orders.map((o: any) => o.id === orderId ? { ...o, status: newStatus } : o) }, false);

      const res = await fetch("/api/admin/orders/status", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ order_id: orderId, status: newStatus }),
      });

      const result = await res.json();
      if (!result.success) {
        alert("Failed to update status.");
        mutate(); // Agar fail ho jaye toh purana data wapas le aaye
      }
    } catch (error) {
      alert("Network error.");
      mutate(); // Revert back on error
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredOrders = orders.filter((o: any) => {
    const matchesSearch = o.id.includes(searchQuery) || 
                          (o.shipping_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (o.guest_email || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "All" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Order Management</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Track and update customer orders from placement to delivery.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by Order ID, Name, or Email..." 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative min-w-[200px]">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select 
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#F4C2C2] appearance-none bg-white capitalize"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-base)] border-b border-gray-100">
                <th className="py-4 px-6 text-sm font-semibold text-gray-600">Order ID & Date</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-600">Customer</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-600">Total</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-600">Status</th>
                <th className="py-4 px-6 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">Loading orders fast...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="py-8 text-center text-red-500">Error loading orders.</td></tr>
              ) : filteredOrders.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-gray-500">No orders found.</td></tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div className="font-mono text-sm text-[var(--text-main)]">{order.id.split('-')[0]}...</div>
                      <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-medium text-[var(--text-main)]">{order.shipping_name || "Guest"}</div>
                      <div className="text-xs text-gray-500">{order.guest_email || "No email"}</div>
                    </td>
                    <td className="py-4 px-6 font-medium text-[var(--text-main)]">
                      ${order.total} <span className="text-xs text-gray-500">{order.currency}</span>
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className={`text-sm font-medium px-3 py-1.5 rounded-lg border focus:outline-none capitalize ${
                          order.status === 'paid' ? 'bg-green-50 text-green-700 border-green-200' :
                          order.status === 'shipped' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          order.status === 'delivered' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                          order.status === 'cancelled' || order.status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button 
                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                        className="p-2 text-gray-400 hover:text-[#C06C84] hover:bg-[#F4C2C2] rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span className="text-xs font-medium">View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}