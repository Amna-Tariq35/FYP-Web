import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-[calc(100vh-72px)] bg-[#FAF7F5]">
      {/* soft background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#F4C2C2]/35 blur-3xl" />
        <div className="absolute -right-24 top-24 h-72 w-72 rounded-full bg-[#C06C84]/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex max-w-6xl items-center justify-center px-4 py-14">
        <div className="w-full max-w-md">
          {/* header */}
          <div className="mb-6 text-center">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-3 py-1 text-xs text-black/60 backdrop-blur">
              AR Makeup • Web
            </div>

            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#1F1F1F]">
              {title}
            </h1>

            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-[#4A4A4A]">
                {subtitle}
              </p>
            ) : null}
          </div>

          {/* card */}
          <div className="rounded-3xl border border-black/10 bg-white/75 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.10)] backdrop-blur md:p-8">
            {children}
          </div>

          {/* footer note */}
          <p className="mt-6 text-center text-xs text-black/45">
            By continuing, you agree to our{" "}
            <Link href="/" className="text-[#C06C84] hover:underline">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/" className="text-[#C06C84] hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
