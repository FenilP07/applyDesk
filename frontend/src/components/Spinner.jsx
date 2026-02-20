export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex items-center gap-3">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
        <span className="text-sm text-neutral-600">{label}</span>
      </div>
    </div>
  );
}
