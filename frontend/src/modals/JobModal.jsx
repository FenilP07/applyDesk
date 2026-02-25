// src/components/AddJobModal.jsx
import { useEffect, useState } from "react";
import { X } from "lucide-react";

function InputField({ label, icon: Icon, ...props }) {
  return (
    <div>
      {label && (
        <label
          className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
          style={{ color: "#A8A29E", fontSize: "0.62rem" }}
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <Icon
            size={14}
            className="absolute left-3"
            style={{ color: "#A8A29E" }}
          />
        )}
        <input
          {...props}
          className="w-full rounded-xl text-sm outline-none transition-all"
          style={{
            background: "#F7F5F2",
            border: "1px solid #E8E4DE",
            padding: Icon ? "9px 12px 9px 34px" : "9px 12px",
            color: "#1C1917",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#D9D4CC";
            e.target.style.boxShadow = "0 0 0 3px rgba(28,25,23,0.04)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#E8E4DE";
            e.target.style.boxShadow = "none";
          }}
        />
      </div>
    </div>
  );
}

export default function AddJobModal({ open, onClose, onCreate }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    status: "applied",
    dateApplied: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (open) {
      setForm({
        title: "",
        company: "",
        location: "",
        status: "applied",
        dateApplied: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (key) => (e) =>
    setForm({ ...form, [key]: e.target.value });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(28,25,23,0.35)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{
          background: "#fff",
          border: "1px solid #E8E4DE",
          boxShadow: "0 24px 48px rgba(28,25,23,0.12)",
        }}
      >
        <div
          className="flex items-center justify-between px-7 py-5"
          style={{ borderBottom: "1px solid #E8E4DE" }}
        >
          <h2
            className="text-lg text-stone-900"
            style={{
              fontFamily: "'Lora', serif",
              fontWeight: 600,
              letterSpacing: "-0.02em",
            }}
          >
            New Application
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-stone-100"
            style={{
              color: "#A8A29E",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-7 py-6 flex flex-col gap-4">
          <InputField
            label="Job Title"
            placeholder="e.g. Frontend Engineer"
            value={form.title}
            onChange={handleChange("title")}
          />
          <div className="grid grid-cols-2 gap-4">
            <InputField
              label="Company"
              placeholder="e.g. Stripe"
              value={form.company}
              onChange={handleChange("company")}
            />
            <InputField
              label="Location"
              placeholder="Remote / City"
              value={form.location}
              onChange={handleChange("location")}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                className="block text-xs font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: "#A8A29E", fontSize: "0.62rem" }}
              >
                Status
              </label>
              <select
                value={form.status}
                onChange={handleChange("status")}
                className="w-full rounded-xl text-sm outline-none"
                style={{
                  background: "#F7F5F2",
                  border: "1px solid #E8E4DE",
                  padding: "9px 12px",
                  color: "#1C1917",
                  fontFamily: "'DM Sans', sans-serif",
                  cursor: "pointer",
                }}
              >
                <option value="applied">Applied</option>
                <option value="interview">Interviewing</option>
                <option value="offer">Offer</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <InputField
              label="Date Applied"
              type="date"
              value={form.dateApplied}
              onChange={handleChange("dateApplied")}
            />
          </div>
        </div>

        <div
          className="px-7 py-5 flex gap-3"
          style={{ background: "#F7F5F2", borderTop: "1px solid #E8E4DE" }}
        >
          <button
            onClick={onClose}
            className="flex-1 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: "#fff",
              border: "1px solid #E8E4DE",
              color: "#57534E",
              padding: "10px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onCreate(form)}
            className="flex-1 rounded-xl text-sm font-semibold transition-all hover:-translate-y-px"
            style={{
              background: "#1C1917",
              color: "#F7F5F2",
              border: "none",
              padding: "10px",
              cursor: "pointer",
            }}
          >
            Save Application
          </button>
        </div>
      </div>
    </div>
  );
}
