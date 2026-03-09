export default function LookDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="text-white/80">
      Look Detail (Coming soon) — <span className="text-white">{params.id}</span>
    </div>
  );
}
