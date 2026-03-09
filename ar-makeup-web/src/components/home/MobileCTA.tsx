export default function MobileCTA() {
  return (
    <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Full AR experience on mobile</h3>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-white/70">
            The web app focuses on products, Try-On Lite, saved looks, and checkout simulation.
            Real-time AR makeup try-on (landmarks + rendering) runs on the mobile app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">
            Mobile: Real-time AR
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-white/70">
            Web: Catalog + Looks
          </div>
        </div>
      </div>

      <div className="mt-6 h-px w-full bg-white/10" />

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {[
          { k: "MediaPipe", v: "Face landmarks detection" },
          { k: "Performance", v: "Latency ≤ 150ms target" },
          { k: "Sync", v: "Supabase saved looks" },
        ].map((x) => (
          <div key={x.k} className="rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-xs text-white/60">{x.k}</div>
            <div className="mt-1 text-sm font-semibold text-white">{x.v}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
