import { useEffect, useState } from "react";
import { X, Link2 } from "lucide-react";

export default function LinkModal({
  open,
  onClose,
  initialValue = "",
  onSave,
}) {
  const [link, setLink] = useState(initialValue);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLink(initialValue || "");
    setError("");
  }, [open, initialValue]);

  if (!open) return null;

  const handleSave = async () => {
    setError("");
    const cleaned = link.trim();

    if (!cleaned) {
      setError("Please enter a link.");
      return;
    }

    try {
      const u = new URL(cleaned);
      if (!["http:", "https:"].includes(u.protocol)) {
        setError("Link must start with http:// or https://");
        return;
      }
    } catch {
      setError("Invalid URL.");
      return;
    }

    try {
      setSaving(true);
      const res = await onSave(cleaned);
      if (res?.success) onClose();
      else setError(res?.message || "Failed to save link.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E4DE] shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#EFEDE9]">
          <div className="flex items-center gap-2">
            <Link2 size={16} className="text-stone-400" />
            <h2 className="text-lg font-semibold font-['Lora'] text-stone-900">
              {initialValue ? "Edit Link" : "Add Link"}
            </h2>
          </div>

          <button
            onClick={onClose}
            disabled={saving}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">
          <label className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E]">
            Application Link
          </label>

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://company.com/job/..."
            className="w-full rounded-xl text-sm bg-[#F7F5F2] border border-[#E8E4DE] px-3 py-2 outline-none focus:ring-2 focus:ring-stone-200 transition-all"
          />

          {error && <div className="text-sm text-rose-600">{error}</div>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 bg-[#F7F5F2] border-t border-[#EFEDE9]">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-[#E8E4DE] rounded-xl py-2 text-sm text-stone-600 hover:bg-white transition-all disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#1C1917] text-white rounded-xl py-2 text-sm hover:bg-black transition-all disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Link"}
          </button>
        </div>
      </div>
    </div>
  );
}
