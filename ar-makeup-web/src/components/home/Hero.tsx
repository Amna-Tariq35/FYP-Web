import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Full-bleed background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero_model.png"
          alt="AR Makeup hero"
          fill
          priority
          className="object-cover"
        />
        {/* Elegant overlays (soft cream + blush tint) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#FBF7F4]/95 via-[#FBF7F4]/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#FBF7F4]/70 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/50 px-3 py-1 text-xs text-black/70 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#E7A6B4]" />
            AR Makeup • Web Experience
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight text-[#141414] sm:text-6xl">
            AR Makeup,
            <span className="text-[#B65C7A]"> beautifully</span> simple.
          </h1>

          <p className="mt-4 text-sm leading-6 text-black/70 sm:text-base">
            Try shades, browse products, and open shared looks — in a clean, elegant web experience.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/try-on"
              className="inline-flex items-center justify-center rounded-2xl bg-[#B65C7A] px-5 py-3 text-sm font-semibold text-white hover:bg-[#A94E6C]"
            >
              Try-On Lite
            </Link>

            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white/60 px-5 py-3 text-sm font-semibold text-[#141414] backdrop-blur hover:bg-white/80"
            >
              Browse Products
            </Link>
          </div>

          <p className="mt-4 text-xs text-black/50">
            Full real-time AR is available on mobile.
          </p>
        </div>
      </div>

      {/* Bottom fade into page */}
      <div className="relative h-10 bg-gradient-to-b from-transparent to-[#FBF7F4]" />
    </section>
  );
}
