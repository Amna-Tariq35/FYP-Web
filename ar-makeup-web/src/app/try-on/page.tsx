"use client";
import { useEffect, useRef, useState } from "react";
import {
  ShoppingCart,
  Loader2,
  AlertCircle,
  X,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import MobilePromo from "../../components/MobilePromo";
import { MakeupProduct, ProductShade } from "../../types/catalog";
import { supabase } from "../../lib/supabase/client";
import { addToCart } from "../../store/cart";

/* ─── DeepAR singleton management (unchanged) ─────────────────────────── */
let deepARInitializePromise: Promise<any> | null = null;
let deepARActiveInstance: any = null;
let deepARPendingShutdown = false;
let deepARActiveMounts = 0;

const deepARInitialize = async (canvas: HTMLCanvasElement) => {
  if (deepARActiveInstance) return deepARActiveInstance;
  if (deepARInitializePromise) return deepARInitializePromise;
  deepARInitializePromise = (async () => {
    const deeparModule = await import("deepar");
    const licenseKey =
      "2952b3fa8af974da37a4802986a2b95c7383ea2f999dc94e83646b7ecab03d9c68e6232e888e8333";
    const instance = await deeparModule.initialize({
      licenseKey,
      canvas,
      effect: "/effects/makeup.deepar",
      additionalOptions: { cameraConfig: { facingMode: "user" } },
    });
    deepARActiveInstance = instance;
    deepARInitializePromise = null;
    if (deepARActiveMounts === 0 && deepARPendingShutdown) {
      instance.shutdown();
      deepARActiveInstance = null;
      deepARPendingShutdown = false;
    }
    return instance;
  })();
  try {
    return await deepARInitializePromise;
  } catch (err) {
    deepARInitializePromise = null;
    throw err;
  }
};

const deepARAcquire = async (canvas: HTMLCanvasElement) => {
  deepARActiveMounts += 1;
  deepARPendingShutdown = false;
  return await deepARInitialize(canvas);
};

const deepARRelease = (instance: any | null) => {
  deepARActiveMounts = Math.max(0, deepARActiveMounts - 1);
  if (deepARActiveMounts === 0) {
    if (deepARInitializePromise) {
      deepARPendingShutdown = true;
      return;
    }
    if (deepARActiveInstance) {
      deepARActiveInstance.shutdown();
      deepARActiveInstance = null;
    }
  }
};
/* ─────────────────────────────────────────────────────────────────────── */

export default function TryOnPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [deepARInstance, setDeepARInstance] = useState<any | null>(null);
  const [isInitializingAR, setIsInitializingAR] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<MakeupProduct[]>([]);
  const [shades, setShades] = useState<ProductShade[]>([]);
  const [activeCategory, setActiveCategory] = useState<"lipstick" | "blush">(
    "lipstick",
  );
  const [appliedMakeup, setAppliedMakeup] = useState<{
    lipstick: {
      product: MakeupProduct;
      shade: ProductShade;
      intensity: number;
    } | null;
    blush: {
      product: MakeupProduct;
      shade: ProductShade;
      intensity: number;
    } | null;
  }>({ lipstick: null, blush: null });
  const [cartMessage, setCartMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchMakeupData = async () => {
      setIsLoadingData(true);
      try {
        const { data: productsData, error: productsError } = await supabase
          .from("makeup_products")
          .select("*")
          .or("product_key.ilike.lip_%,product_key.ilike.blu_%")
          .eq("is_active", true);
        if (productsError) throw productsError;
        if (productsData && productsData.length > 0) {
          const productKeys = productsData.map((p) => p.product_key);
          const { data: shadesData, error: shadesError } = await supabase
            .from("product_shades")
            .select("*")
            .in("product_key", productKeys);
          if (shadesError) throw shadesError;
          setProducts(productsData);
          setShades(shadesData || []);
        }
      } catch (err: any) {
        console.error("Error fetching data from Supabase:", err.message);
      } finally {
        setIsLoadingData(false);
      }
    };
    fetchMakeupData();
  }, []);

  useEffect(() => {
    let isActive = true;
    let instance: any = null;
    const initializeDeepAR = async () => {
      if (!canvasRef.current) return;
      setIsInitializingAR(true);
      try {
        instance = await deepARAcquire(canvasRef.current);
        if (!isActive) return;
        setDeepARInstance(instance);
      } catch (err) {
        console.error("DeepAR Initialization Error:", err);
        setError(
          "Could not initialize camera. Please check permissions and license key.",
        );
      } finally {
        setIsInitializingAR(false);
      }
    };
    initializeDeepAR();
    return () => {
      isActive = false;
      deepARRelease(instance);
    };
  }, []);

  const applyMakeupToDeepAR = async (
    category: "lipstick" | "blush",
    shade: ProductShade | null,
    intensity: number,
  ) => {
    if (!deepARInstance) return;
    const nodeName = category === "lipstick" ? "Lips" : "Blush";
    const paramName = category === "lipstick" ? "u_diffuseColor" : "u_color";
    if (!shade || !shade.shade_hex) {
      try {
        await deepARInstance.changeParameterVector(
          nodeName,
          "MeshRenderer",
          paramName,
          0,
          0,
          0,
          0,
        );
      } catch (e) {
        console.error(e);
      }
      return;
    }
    try {
      const hex = shade.shade_hex.replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) / 255;
      const g = parseInt(hex.substring(2, 4), 16) / 255;
      const b = parseInt(hex.substring(4, 6), 16) / 255;
      await deepARInstance.changeParameterVector(
        nodeName,
        "MeshRenderer",
        paramName,
        r,
        g,
        b,
        intensity,
      );
    } catch (err) {
      console.error("Error changing shade in DeepAR:", err);
    }
  };

  const currentProduct = products.find((p) =>
    activeCategory === "lipstick"
      ? p.product_key.startsWith("lip_")
      : p.product_key.startsWith("blu_"),
  );
  const currentShades = shades.filter(
    (s) => s.product_key === currentProduct?.product_key,
  );

  const handleShadeSelect = (shade: ProductShade) => {
    if (!currentProduct) return;
    const newIntensity = appliedMakeup[activeCategory]?.intensity ?? 0.6;
    setAppliedMakeup((prev) => ({
      ...prev,
      [activeCategory]: {
        product: currentProduct,
        shade,
        intensity: newIntensity,
      },
    }));
    applyMakeupToDeepAR(activeCategory, shade, newIntensity);
  };

  const handleIntensityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  // 1. Slider se 0-100 ki value lein
  const userValue = parseFloat(e.target.value);
  
  // 2. Isse 0.6 ki scale par convert karein (Backend/DeepAR ke liye)
  const actualIntensity = (userValue / 100) * 0.6;
  
  const currentApplied = appliedMakeup[activeCategory];
  
  if (currentApplied) {
    // 3. State mein actual (0.6 wali) value save karein
    setAppliedMakeup((prev) => ({
      ...prev,
      [activeCategory]: { ...currentApplied, intensity: actualIntensity },
    }));

    // 4. DeepAR ko bhi wahi 0.6 wali value bhejein
    applyMakeupToDeepAR(activeCategory, currentApplied.shade, actualIntensity);
  }
};

  const handleClearCategory = () => {
    setAppliedMakeup((prev) => ({ ...prev, [activeCategory]: null }));
    applyMakeupToDeepAR(activeCategory, null, 0);
  };

  const handleAddSingle = (category: "lipstick" | "blush") => {
    const item = appliedMakeup[category];
    if (!item) return;
    addToCart({
      product_key: item.product.product_key,
      shade_key: item.shade.shade_key,
      shade_name: item.shade.shade_name,
      quantity: 1,
      name: item.product.name,
      brand: item.product.brand,
      price: item.product.price,
      image_url: item.product.image_url,
    });
    setCartMessage(`${item.product.name} Added ✓`);
    setTimeout(() => setCartMessage(null), 1600);
  };

  const handleAddAll = () => {
    const items = [appliedMakeup.lipstick, appliedMakeup.blush].filter(Boolean);
    if (items.length === 0) return;
    items.forEach((item) => {
      if (item)
        addToCart({
          product_key: item.product.product_key,
          shade_key: item.shade.shade_key,
          shade_name: item.shade.shade_name,
          quantity: 1,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          image_url: item.product.image_url,
        });
    });
    setCartMessage("All items added ✓");
    setTimeout(() => setCartMessage(null), 1600);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

        .tryon-root {
          font-family: 'DM Sans', sans-serif;
          background: #FAF7F5;
          min-height: 100vh;
        }

        .tryon-root * { box-sizing: border-box; }

        /* Decorative blobs */
        .bg-blob {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.35;
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 { width: 500px; height: 500px; top: -120px; left: -140px; background: radial-gradient(circle, #e8b4c0, #f7d9e3); }
        .blob-2 { width: 400px; height: 400px; bottom: -100px; right: -100px; background: radial-gradient(circle, #c9a0b4, #e8c9d4); }

        /* Page wrapper */
        .page-inner {
          position: relative;
          z-index: 1;
          max-width: 1280px;
          margin: 0 auto;
          padding: 40px 24px 80px;
        }

        /* Header */
        .page-header { margin-bottom: 36px; }
        .page-title {
          font-family: 'Cormorant Garamond', serif;
          font-size: clamp(2rem, 4vw, 3rem);
          font-weight: 400;
          color: #1a1a1a;
          line-height: 1.1;
          letter-spacing: -0.01em;
          margin: 0 0 6px;
        }
        .page-title em { font-style: italic; color: #C06C84; }
        .page-subtitle {
          font-size: 14px;
          color: #9a8f8f;
          font-weight: 400;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Main grid */
        .main-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 1024px) {
          .main-grid { grid-template-columns: 1fr 420px; gap: 32px; }
        }

        /* Camera card */
        .camera-card {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          background: #1a1a1a;
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 32px 80px rgba(192,108,132,0.15), 0 8px 24px rgba(0,0,0,0.12);
        }
        @media (max-width: 1023px) {
          .camera-card { aspect-ratio: 3/4; max-height: 70vh; }
        }
        .camera-card canvas { width: 100%; height: 100%; object-fit: cover; display: block; }

        .camera-overlay-state {
          position: absolute; inset: 0;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          background: #FAF7F5;
          z-index: 10;
          gap: 12px;
        }
        .camera-overlay-state p { font-size: 13px; color: #9a8f8f; font-weight: 500; letter-spacing: 0.04em; }

        .live-badge {
          position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 7px 20px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          display: flex; align-items: center; gap: 6px;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ff6b8a;
          animation: pulse-dot 1.5s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.7); }
        }

        /* Controls panel */
        .controls-panel {
          background: #fff;
          border-radius: 28px;
          padding: 28px;
          box-shadow: 0 8px 40px rgba(0,0,0,0.06);
          border: 1px solid rgba(0,0,0,0.04);
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        /* Category tabs */
        .tab-wrap {
          display: flex;
          background: #FAF7F5;
          border-radius: 100px;
          padding: 4px;
          margin-bottom: 28px;
          position: relative;
        }
        .tab-btn {
          flex: 1; border: none; background: transparent;
          padding: 10px 0;
          font-size: 13px; font-weight: 500;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.25s ease;
          color: #9a8f8f;
          letter-spacing: 0.04em;
          position: relative; z-index: 1;
        }
        .tab-btn.active {
          background: #fff;
          color: #C06C84;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
        }

        /* Section label */
        .section-label {
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #b0a0a8;
          margin-bottom: 16px;
        }

        /* Shade grid — horizontal scrolling rows */
        .shades-section { margin-bottom: 24px; }
        .shades-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .clear-btn {
          display: flex; align-items: center; gap: 4px;
          font-size: 12px; color: #b0a0a8;
          background: none; border: none; cursor: pointer;
          transition: color 0.2s;
          font-family: 'DM Sans', sans-serif;
          padding: 0;
        }
        .clear-btn:hover { color: #C06C84; }

        .shades-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px 8px;
          max-height: 200px;
          overflow-y: auto;
          padding-right: 4px;
          padding-bottom: 4px;
        }
        .shades-grid::-webkit-scrollbar { width: 3px; }
        .shades-grid::-webkit-scrollbar-track { background: #f0ebee; border-radius: 10px; }
        .shades-grid::-webkit-scrollbar-thumb { background: #d4b0bc; border-radius: 10px; }

        .shade-item {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          cursor: pointer; background: none; border: none; padding: 0;
          transition: transform 0.2s ease;
        }
        .shade-item:hover { transform: translateY(-2px); }
        .shade-item.selected { transform: translateY(-3px); }

        .shade-swatch {
          width: 40px; height: 40px;
          border-radius: 50%;
          border: 2.5px solid transparent;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          flex-shrink: 0;
        }
        .shade-item.selected .shade-swatch {
          border-color: #C06C84;
          box-shadow: 0 0 0 3px rgba(192,108,132,0.2), 0 2px 8px rgba(0,0,0,0.15);
        }

        .shade-name {
          font-size: 9px;
          font-weight: 500;
          text-align: center;
          line-height: 1.3;
          color: #9a8f8f;
          max-width: 44px;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .shade-item.selected .shade-name { color: #C06C84; }

        /* Intensity slider */
        .intensity-section { margin-bottom: 24px; }
        .intensity-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px;
        }
        .intensity-value {
          font-size: 12px; font-weight: 600;
          color: #C06C84;
          background: rgba(192,108,132,0.08);
          padding: 3px 10px; border-radius: 100px;
        }

        .slider-track {
          position: relative;
          height: 6px;
          background: #f0ebee;
          border-radius: 100px;
          margin-bottom: 2px;
        }
        .slider-fill {
          position: absolute;
          left: 0; top: 0; bottom: 0;
          background: linear-gradient(to right, #e8b4c0, #C06C84);
          border-radius: 100px;
          pointer-events: none;
          transition: width 0.05s;
        }
        .intensity-input {
          position: absolute;
          inset: -6px 0;
          width: 100%;
          opacity: 0;
          cursor: pointer;
          height: 18px;
          margin: 0;
        }

        /* Divider */
        .divider {
          height: 1px;
          background: rgba(0,0,0,0.05);
          margin: 24px 0;
        }

        /* Shop section */
        .shop-section { display: flex; flex-direction: column; flex: 1; }
        .empty-state {
          text-align: center; padding: 24px 0;
          color: #b0a0a8; font-size: 13px; line-height: 1.6;
        }
        .empty-state-icon { font-size: 28px; margin-bottom: 8px; }

        /* Product card in shop */
        .product-card {
          display: flex; align-items: center; gap: 12px;
          background: #FAF7F5;
          border-radius: 16px;
          padding: 12px;
          border: 1px solid rgba(0,0,0,0.04);
          margin-bottom: 10px;
        }
        .product-swatch {
          width: 36px; height: 36px; border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.12);
          flex-shrink: 0;
        }
        .product-info { flex: 1; min-width: 0; }
        .product-brand { font-size: 10px; color: #b0a0a8; font-weight: 500; letter-spacing: 0.04em; }
        .product-name {
          font-size: 13px; font-weight: 600; color: #1a1a1a;
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          margin: 1px 0;
        }
        .product-shade-name { font-size: 11px; color: #C06C84; font-weight: 500; }
        .product-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .product-price { font-size: 14px; font-weight: 600; color: #1a1a1a; }
        .add-single-btn {
          font-size: 11px; font-weight: 600;
          background: #fff; color: #1a1a1a;
          border: 1.5px solid #e0d5d9;
          padding: 5px 14px; border-radius: 100px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          white-space: nowrap;
          letter-spacing: 0.02em;
        }
        .add-single-btn:hover { background: #1a1a1a; color: #fff; border-color: #1a1a1a; }

        /* Add all button */
        .add-all-wrap { position: relative; margin-top: 12px; }
        .add-all-btn {
          width: 100%;
          background: linear-gradient(135deg, #C06C84 0%, #a85870 100%);
          color: #fff;
          border: none;
          padding: 16px;
          border-radius: 16px;
          font-size: 14px; font-weight: 600;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.25s ease;
          letter-spacing: 0.02em;
          box-shadow: 0 8px 24px rgba(192,108,132,0.35);
        }
        .add-all-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(192,108,132,0.45);
        }
        .add-all-btn:active { transform: translateY(0); }

        /* Cart toast */
        .cart-toast {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%; transform: translateX(-50%);
          background: #1a1a1a;
          color: #fff;
          font-size: 12px; font-weight: 500;
          padding: 8px 18px;
          border-radius: 100px;
          display: flex; align-items: center; gap: 6px;
          white-space: nowrap;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
          animation: toast-in 0.3s ease;
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translate(-50%, 6px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }

        /* Loading spinner */
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Mobile Promo wrapper */
        .promo-wrap {
          margin-top: 48px;
          background: linear-gradient(135deg, #fff8f9 0%, #fdf0f4 100%);
          border-radius: 24px;
          border: 1px solid rgba(192,108,132,0.12);
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(192,108,132,0.08);
        }
      `}</style>

      <div className="tryon-root">
        {/* Decorative background blobs */}
        <div className="bg-blob blob-1" />
        <div className="bg-blob blob-2" />

        <div className="page-inner">
          {/* Header */}
          <div className="page-header">
            <h1 className="page-title">
              Virtual <em>Try‑On</em>
            </h1>
            <p className="page-subtitle">
              <Sparkles size={13} style={{ color: "#C06C84" }} />
              Experience our signature shades in real‑time
            </p>
          </div>

          {/* Main layout */}
          <div className="main-grid">
            {/* ── Camera ── */}
            <div className="camera-card">
              {isInitializingAR && (
                <div className="camera-overlay-state">
                  <Loader2
                    size={36}
                    style={{ color: "#C06C84" }}
                    className="spin"
                  />
                  <p>Starting Camera…</p>
                </div>
              )}
              {error && (
                <div
                  className="camera-overlay-state"
                  style={{ padding: "32px", textAlign: "center" }}
                >
                  <AlertCircle
                    size={40}
                    style={{ color: "#e07090", marginBottom: 12 }}
                  />
                  <p
                    style={{
                      fontWeight: 600,
                      color: "#1a1a1a",
                      marginBottom: 6,
                    }}
                  >
                    Camera Error
                  </p>
                  <p style={{ fontSize: 13, color: "#9a8f8f" }}>{error}</p>
                </div>
              )}
              <canvas ref={canvasRef} />
              {!isInitializingAR && !error && (
                <div className="live-badge">
                  <div className="live-dot" />
                  Live Preview
                </div>
              )}
            </div>

            {/* ── Controls ── */}
            <div className="controls-panel">
              {/* Category Tabs */}
              <div className="tab-wrap">
                <button
                  className={cn(
                    "tab-btn",
                    activeCategory === "lipstick" && "active",
                  )}
                  onClick={() => setActiveCategory("lipstick")}
                >
                  Lipstick
                </button>
                <button
                  className={cn(
                    "tab-btn",
                    activeCategory === "blush" && "active",
                  )}
                  onClick={() => setActiveCategory("blush")}
                >
                  Blush
                </button>
              </div>

              {isLoadingData ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 0",
                  }}
                >
                  <Loader2
                    size={28}
                    style={{ color: "#C06C84" }}
                    className="spin"
                  />
                </div>
              ) : (
                <>
                  {/* Shade selection */}
                  <div className="shades-section">
                    <div className="shades-header">
                      <span className="section-label">Select Shade</span>
                      {appliedMakeup[activeCategory] && (
                        <button
                          className="clear-btn"
                          onClick={handleClearCategory}
                        >
                          <X size={12} /> Clear
                        </button>
                      )}
                    </div>

                    {currentShades.length > 0 ? (
                      <div className="shades-grid">
                        {currentShades.map((shade) => {
                          const isSelected =
                            appliedMakeup[activeCategory]?.shade.shade_key ===
                            shade.shade_key;
                          return (
                            <button
                              key={shade.shade_key}
                              className={cn(
                                "shade-item",
                                isSelected && "selected",
                              )}
                              onClick={() => handleShadeSelect(shade)}
                            >
                              <div
                                className="shade-swatch"
                                style={{
                                  backgroundColor: shade.shade_hex || "#cccccc",
                                }}
                              />
                              <span className="shade-name">
                                {shade.shade_name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p style={{ fontSize: 13, color: "#b0a0a8" }}>
                        No shades available.
                      </p>
                    )}
                  </div>

                  {/* Intensity slider */}
                  {appliedMakeup[activeCategory] && (
                    <div className="intensity-section">
                      <div className="intensity-header">
                        <span className="section-label">Intensity</span>
                        <span className="intensity-value">
                          {/* User ko hamesha 0-100 dikhayen */}
                          {Math.round(
                            (appliedMakeup[activeCategory]!.intensity / 0.6) *
                              100,
                          )}
                          %
                        </span>
                      </div>
                      <div className="slider-track">
                        <div
                          className="slider-fill"
                          /* Fill bar ko user ki percentage (0-100) ke mutabiq set karein */
                          style={{
                            width: `${(appliedMakeup[activeCategory]!.intensity / 0.6) * 100}%`,
                          }}
                        />
                        <input
                          type="range"
                          min="0"
                          max="100" // User ke liye 100
                          step="1"
                          // State ki 0.6 wali value ko wapas 100 ki scale par dikhane ke liye:
                          value={
                            (appliedMakeup[activeCategory]?.intensity / 0.6) *
                              100 || 0
                          }
                          onChange={handleIntensityChange}
                          className="intensity-input"
                        />
                      </div>
                    </div>
                  )}

                  <div className="divider" />

                  {/* Shop your look */}
                  <div className="shop-section">
                    <span
                      className="section-label"
                      style={{ marginBottom: 16 }}
                    >
                      Shop Your Look
                    </span>

                    {!appliedMakeup.lipstick && !appliedMakeup.blush ? (
                      <div className="empty-state">
                        <div className="empty-state-icon">💄</div>
                        Select a shade above to see product details here
                      </div>
                    ) : (
                      <>
                        {appliedMakeup.lipstick && (
                          <div className="product-card">
                            <div
                              className="product-swatch"
                              style={{
                                backgroundColor:
                                  appliedMakeup.lipstick.shade.shade_hex ||
                                  "#ccc",
                              }}
                            />
                            <div className="product-info">
                              <div className="product-brand">
                                {appliedMakeup.lipstick.product.brand ||
                                  "Lumière"}
                              </div>
                              <div className="product-name">
                                {appliedMakeup.lipstick.product.name}
                              </div>
                              <div className="product-shade-name">
                                {appliedMakeup.lipstick.shade.shade_name}
                              </div>
                            </div>
                            <div className="product-right">
                              <span className="product-price">
                                $
                                {appliedMakeup.lipstick.product.price?.toFixed(
                                  2,
                                ) || "0.00"}
                              </span>
                              <button
                                className="add-single-btn"
                                onClick={() => handleAddSingle("lipstick")}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}

                        {appliedMakeup.blush && (
                          <div className="product-card">
                            <div
                              className="product-swatch"
                              style={{
                                backgroundColor:
                                  appliedMakeup.blush.shade.shade_hex || "#ccc",
                              }}
                            />
                            <div className="product-info">
                              <div className="product-brand">
                                {appliedMakeup.blush.product.brand || "Lumière"}
                              </div>
                              <div className="product-name">
                                {appliedMakeup.blush.product.name}
                              </div>
                              <div className="product-shade-name">
                                {appliedMakeup.blush.shade.shade_name}
                              </div>
                            </div>
                            <div className="product-right">
                              <span className="product-price">
                                $
                                {appliedMakeup.blush.product.price?.toFixed(
                                  2,
                                ) || "0.00"}
                              </span>
                              <button
                                className="add-single-btn"
                                onClick={() => handleAddSingle("blush")}
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="add-all-wrap">
                          <button
                            className="add-all-btn"
                            onClick={handleAddAll}
                          >
                            <ShoppingCart size={16} />
                            Add All to Cart
                          </button>
                          {cartMessage && (
                            <div className="cart-toast">
                              <Check size={13} style={{ color: "#6ee7b7" }} />
                              {cartMessage}
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Promo */}
          <div className="promo-wrap">
            <MobilePromo />
          </div>
        </div>
      </div>
    </>
  );
}
