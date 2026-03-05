import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function LinkModal({ open, onClose, initialValue = "", onSave }) {
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
        <div className="flex justify-between items-center px-6 py-5 border-b">
          <h2 className="text-lg font-semibold font-['Lora']">
            {initialValue ? "Edit Link" : "Add Link"}
          </h2>
          <button onClick={onClose} disabled={saving}>
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-3">
          <label className="text-[0.62rem] font-semibold uppercase tracking-widest text-[#A8A29E]">
            Link
          </label>

          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-xl text-sm bg-[#F7F5F2] border border-[#E8E4DE] px-3 py-2 outline-none"
          />

          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="px-6 py-4 flex gap-3 bg-[#F7F5F2] border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border rounded-xl py-2 text-sm disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-[#1C1917] text-white rounded-xl py-2 text-sm disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Link"}
          </button>
        </div>
      </div>
    </div>
  );
}