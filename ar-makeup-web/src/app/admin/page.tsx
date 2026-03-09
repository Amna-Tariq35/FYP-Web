"use client";

import React, { useEffect, useState } from "react";
import { DollarSign, ShoppingBag, Clock, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase/client";

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    pendingOrdersCount: 0,
    recentOrders: [] as any[]
  });
  const [loading, setLoading] = useState(true);

// src/app/admin/page.tsx ke andar fetchDashboardData function ko update karein:

useEffect(() => {
  async function fetchDashboardData() {
    try {
      // 1. Current user ka token get karein
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // 2. Fetch request mein token as a Header bhejein
      const res = await fetch("/api/admin/dashboard", {
        headers: {
          "Authorization": `Bearer ${token}` // Yeh line backend ke verifyAdmin ko pass karegi
        }
      });
      
      const data = await res.json();
      if (res.ok && data) {
        setStats({
          totalRevenue: data.totalRevenue || 0,
          totalOrders: data.totalOrders || 0,
          pendingOrdersCount: data.pendingOrdersCount || 0,
          recentOrders: data.recentOrders || []
        });
      } else {
        console.error("API Error:", data.error);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }
  fetchDashboardData();
}, []);

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Welcome back, Admin. Here is your store's real-time performance.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-green-50 text-green-600 rounded-xl">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-blue-50 text-blue-600 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="p-4 bg-orange-50 text-orange-600 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Pending Orders</p>
            <h3 className="text-2xl font-bold text-gray-900">{stats.pendingOrdersCount}</h3>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-[var(--text-main)]">Recent Orders</h2>
          <button onClick={() => router.push('/admin/orders')} className="text-sm text-[#C06C84] font-medium hover:underline flex items-center gap-1">
            View All <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Order ID</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                <th className="py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.length === 0 ? (
                <tr><td colSpan={4} className="py-6 text-center text-gray-500">No orders yet.</td></tr>
              ) : (
                stats.recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-4 px-6 font-mono text-sm text-gray-600">{order.id.split('-')[0]}...</td>
                    <td className="py-4 px-6 font-medium text-gray-900">{order.shipping_name || "Guest"}</td>
                    <td className="py-4 px-6 font-medium text-gray-900">${order.total}</td>
                    <td className="py-4 px-6">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${
                        order.status === 'paid' ? 'bg-green-100 text-green-700' :
                        order.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                        order.status === 'delivered' ? 'bg-purple-100 text-purple-700' :
                        order.status === 'cancelled' || order.status === 'failed' ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {order.status}
                      </span>
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