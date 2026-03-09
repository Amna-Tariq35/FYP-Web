import Link from "next/link";

const items = [
  { title: "Try-On Lite", desc: "Preview shades on your photo.", href: "/try-on" },
  { title: "Browse Products", desc: "Explore catalog & shades.", href: "/products" },
  { title: "Skin Analysis", desc: "Get skin-aware suggestions.", href: "/skin-analysis" },
  { title: "Saved Looks", desc: "View & manage saved looks.", href: "/my-looks" },
];

export default function FeatureCards() {
  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#141414]">Explore</h2>
          <p className="mt-1 text-sm text-black/60">Quick access to core features.</p>
        </div>

        <Link
          href="/products"
          className="hidden text-sm font-semibold text-[#B65C7A] hover:underline sm:inline-flex"
        >
          View catalog →
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((x) => (
          <Link
            key={x.title}
            href={x.href}
            className="group rounded-2xl border border-black/10 bg-white/60 p-5 backdrop-blur transition hover:bg-white/80"
          >
            <div className="flex items-center justify-between">
              <div className="text-base font-semibold text-[#141414]">{x.title}</div>
              <span className="text-black/35 group-hover:text-[#B65C7A]">→</span>
            </div>
            <p className="mt-2 text-sm text-black/60">{x.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
