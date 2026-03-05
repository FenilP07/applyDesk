import { useEffect, useState } from "react";
import {
  X,
  Tag,
  AlertCircle,
  Star,
  Archive,
  ChevronDown,
  ChevronUp,
  Link,
  MapPin,
  Calendar,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useJobStore from "../store/jobStore";

// ─── CONFIG & STYLES ─────────────────────────────────────────────────────────

const STATUSES = ["applied", "interview", "offer", "rejected"];
const PRIORITIES = ["low", "medium", "high"];

const PILL_STYLES = {
  applied: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer: "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

// ─── UI COMPONENTS ───────────────────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <label className="block text-[0.62rem] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">
      {children}
    </label>
  );
}

function Input({ error, icon: Icon, ...props }) {
  return (
    <div className="relative w-full">
      {Icon && (
        <Icon
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300"
        />
      )}
      <input
        {...props}
        className={`w-full rounded-xl text-sm bg-[#F7F5F2] border px-3 py-2.5 outline-none
          focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all
          placeholder:text-stone-300 ${Icon ? "pl-9" : ""}
          ${error ? "border-rose-300 shadow-sm shadow-rose-50" : "border-[#E8E4DE]"}`}
      />
    </div>
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl text-sm bg-[#F7F5F2] border border-[#E8E4DE] px-3 py-2.5 outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer appearance-none transition-all"
    >
      {children}
    </select>
  );
}

const emptyForm = () => ({
  title: "",
  company: "",
  location: "",
  status: "applied",
  priority: "medium",
  link: "",
  sourceUrl: "",
  dateApplied: new Date().toISOString().slice(0, 10),
  tags: "",
  starred: false,
  archived: false,
});

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function JobModal({ open, onClose, job }) {
  const { createJob, updateJob } = useJobStore();
  const isEdit = !!job;

  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError("");
    if (isEdit && job) {
      setIsExpanded(true);
      setForm({
        ...job,
        tags: Array.isArray(job.tags) ? job.tags.join(", ") : job.tags || "",
        dateApplied:
          job.dateApplied?.slice(0, 10) ||
          new Date().toISOString().slice(0, 10),
      });
    } else {
      setForm(emptyForm());
      setIsExpanded(false);
    }
  }, [open, job, isEdit]);

  if (!open) return null;

  const set = (key) => (e) => {
    const val =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));

  const handleSubmit = async () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Required";
    if (!form.company.trim()) errs.company = "Required";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    const payload = {
      ...form,
      tags: form.tags
        ? form.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
    };

    const res = isEdit
      ? await updateJob(job.id, payload)
      : await createJob(payload);
    setSaving(false);

    if (res?.success) onClose();
    else setServerError(res?.error || "Submission failed.");
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center bg-stone-900/40 backdrop-blur-sm p-0 sm:p-4 z-[100]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={
          window.innerWidth < 640
            ? { y: "100%" }
            : { opacity: 0, scale: 0.98, y: 10 }
        }
        animate={
          window.innerWidth < 640 ? { y: 0 } : { opacity: 1, scale: 1, y: 0 }
        }
        exit={
          window.innerWidth < 640 ? { y: "100%" } : { opacity: 0, scale: 0.98 }
        }
        className="w-full max-w-lg bg-white rounded-t-[2.5rem] sm:rounded-3xl border border-[#E8E4DE] shadow-2xl flex flex-col overflow-hidden max-h-[95vh] sm:max-h-[85vh]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Mobile Handle */}
        <div className="sm:hidden w-12 h-1 bg-stone-200 rounded-full mx-auto mt-4 shrink-0" />

        {/* Header */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-[#EFEDE9]">
          <div>
            <h2 className="text-xl font-semibold font-['Lora'] text-stone-900">
              {isEdit ? "Edit Application" : "New Application"}
            </h2>
            <p className="text-[0.6rem] text-stone-400 font-bold uppercase tracking-widest mt-1">
              Essentials
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-stone-50 transition-colors"
          >
            <X size={20} className="text-stone-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="px-8 py-6 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
          {serverError && (
            <div className="flex items-center gap-2 text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 animate-in fade-in zoom-in duration-300">
              <AlertCircle size={14} /> {serverError}
            </div>
          )}

          {/* PHASE 1: ESSENTIALS */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <FieldLabel>Role Name *</FieldLabel>
                <Input
                  placeholder="Software Engineer"
                  value={form.title}
                  onChange={set("title")}
                  error={errors.title}
                />
              </div>
              <div>
                <FieldLabel>Company *</FieldLabel>
                <Input
                  placeholder="Apple"
                  value={form.company}
                  onChange={set("company")}
                  error={errors.company}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Location</FieldLabel>
              <Input
                placeholder="Toronto / Remote"
                value={form.location}
                onChange={set("location")}
                icon={MapPin}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Status</FieldLabel>
                <StyledSelect value={form.status} onChange={set("status")}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s.toUpperCase()}
                    </option>
                  ))}
                </StyledSelect>
              </div>
              <div>
                <FieldLabel>Date Applied</FieldLabel>
                <Input
                  type="date"
                  value={form.dateApplied}
                  onChange={set("dateApplied")}
                  icon={Calendar}
                />
              </div>
            </div>
          </div>

          {/* TOGGLE PHASE 2 */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-center gap-2 py-3 text-[0.62rem] font-bold uppercase tracking-widest text-stone-400 bg-stone-50 rounded-xl hover:text-stone-600 transition-all border border-dashed border-stone-200"
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {isExpanded ? "Show Less" : "More Details"}
          </button>

          {/* PHASE 2: OPTIONAL */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="space-y-5 pt-2 pb-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel>Job Link</FieldLabel>
                      <Input
                        placeholder="linkedin.com/..."
                        value={form.link}
                        onChange={set("link")}
                        icon={Link}
                      />
                    </div>
                    <div>
                      <FieldLabel>Priority</FieldLabel>
                      <StyledSelect
                        value={form.priority}
                        onChange={set("priority")}
                      >
                        {PRIORITIES.map((p) => (
                          <option key={p} value={p}>
                            {p.toUpperCase()}
                          </option>
                        ))}
                      </StyledSelect>
                    </div>
                  </div>

                  <div>
                    <FieldLabel>Tags (comma separated)</FieldLabel>
                    <Input
                      placeholder="Fintech, React, High Pay"
                      value={form.tags}
                      onChange={set("tags")}
                      icon={Tag}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => toggle("starred")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                        form.starred
                          ? "bg-amber-50 border-amber-200 text-amber-600 shadow-sm"
                          : "bg-white border-stone-200 text-stone-400 hover:border-stone-300"
                      }`}
                    >
                      <Star
                        size={14}
                        fill={form.starred ? "currentColor" : "none"}
                      />
                      {form.starred ? "Starred" : "Star"}
                    </button>
                    {isEdit && (
                      <button
                        type="button"
                        onClick={() => toggle("archived")}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                          form.archived
                            ? "bg-stone-800 border-stone-800 text-white"
                            : "bg-white border-stone-200 text-stone-400 hover:border-stone-300"
                        }`}
                      >
                        <Archive size={14} />
                        {form.archived ? "Archived" : "Archive"}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-[#F7F5F2] border-t border-[#EFEDE9] flex flex-col sm:flex-row gap-3">
          <button
            onClick={onClose}
            className="order-2 sm:order-1 px-6 py-3 text-sm font-bold text-stone-400 hover:text-stone-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="order-1 sm:order-2 flex-1 bg-stone-900 text-white rounded-2xl py-3.5 text-sm font-bold hover:bg-black transition-all shadow-xl shadow-stone-200 disabled:opacity-50 flex items-center justify-center gap-3 active:scale-[0.98]"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : isEdit ? (
              "Update Changes"
            ) : (
              "Save Application"
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
