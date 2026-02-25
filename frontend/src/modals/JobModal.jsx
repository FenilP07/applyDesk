import { useEffect, useState } from "react";
import { X } from "lucide-react";

function InputField({ label, ...props }) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-semibold uppercase tracking-widest mb-1.5 text-[#A8A29E]">
          {label}
        </label>
      )}
      <input
        {...props}
        className="w-full rounded-xl text-sm bg-[#F7F5F2] border border-[#E8E4DE] px-3 py-2 outline-none"
      />
    </div>
  );
}

export default function JobModal({
  open,
  onClose,
  onCreate,
  onUpdate,
  job,
}) {
  const isEdit = !!job;

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    status: "applied",
    dateApplied: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!open) return;

    if (isEdit) {
      setForm({
        title: job.title || "",
        company: job.company || "",
        location: job.location || "",
        status: job.status || "applied",
        dateApplied: job.dateApplied?.slice(0, 10) || "",
      });
    } else {
      setForm({
        title: "",
        company: "",
        location: "",
        status: "applied",
        dateApplied: new Date().toISOString().slice(0, 10),
      });
    }
  }, [open, job, isEdit]);

  if (!open) return null;

  const handleChange = (key) => (e) =>
    setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async () => {
    if (!form.title || !form.company) return;

    let res;
    if (isEdit) {
      res = await onUpdate(job.id, form);
    } else {
      res = await onCreate(form);
    }

    if (res.success) onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 z-50">
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#E8E4DE] shadow-xl">
        <div className="flex justify-between items-center px-6 py-5 border-b">
          <h2 className="text-lg font-semibold font-['Lora']">
            {isEdit ? "Edit Application" : "New Application"}
          </h2>
          <button onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 flex flex-col gap-4">
          <InputField
            label="Job Title"
            value={form.title}
            onChange={handleChange("title")}
          />
          <InputField
            label="Company"
            value={form.company}
            onChange={handleChange("company")}
          />
          <InputField
            label="Location"
            value={form.location}
            onChange={handleChange("location")}
          />
          <InputField
            label="Date Applied"
            type="date"
            value={form.dateApplied}
            onChange={handleChange("dateApplied")}
          />
        </div>

        <div className="px-6 py-4 flex gap-3 bg-[#F7F5F2] border-t">
          <button
            onClick={onClose}
            className="flex-1 border rounded-xl py-2 text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 bg-[#1C1917] text-white rounded-xl py-2 text-sm"
          >
            {isEdit ? "Save Changes" : "Create Application"}
          </button>
        </div>
      </div>
    </div>
  );
}