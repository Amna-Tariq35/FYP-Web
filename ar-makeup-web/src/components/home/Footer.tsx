import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-[#F4EEE8]">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-white/70 ring-1 ring-black/10">
                <div className="h-2 w-2 rounded-full bg-[#B65C7A]" />
              </div>
              <div className="font-semibold text-[#141414]">AR Makeup</div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-6 text-black/60">
              A virtual makeup try-on web experience for product discovery, saved looks,
              and shareable results — built as a Final Year Project.
            </p>
          </div>

          {/* Explore */}
          <div>
            <div className="text-sm font-semibold text-black/80">Explore</div>
            <div className="mt-4 grid gap-2 text-sm text-black/60">
              <Link href="/products" className="hover:text-[#B65C7A]">
                Products
              </Link>
              <Link href="/try-on" className="hover:text-[#B65C7A]">
                Try-On Lite
              </Link>
              <Link href="/skin-analysis" className="hover:text-[#B65C7A]">
                Skin Analysis
              </Link>
              <Link href="/my-looks" className="hover:text-[#B65C7A]">
                Saved Looks
              </Link>
            </div>
          </div>

          {/* Tech */}
          <div>
            <div className="text-sm font-semibold text-black/80">Technology</div>
            <div className="mt-4 grid gap-2 text-sm text-black/60">
              <p>Next.js (App Router)</p>
              <p>Supabase (Auth & Database)</p>
              <p>Stripe (Test Checkout)</p>
              <p>Mobile AR: MediaPipe</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-black/10 pt-6 text-xs text-black/50 sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} AR Makeup. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#B65C7A]">
              Privacy
            </Link>
            <Link href="/" className="hover:text-[#B65C7A]">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
