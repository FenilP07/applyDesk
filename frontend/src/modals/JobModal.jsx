import { useEffect, useState } from "react";
import { X, Tag, AlertCircle, Star, Archive } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useJobStore from "../store/jobStore";

const STATUSES   = ["applied", "interview", "offer", "rejected"];
const PRIORITIES = ["low", "medium", "high"];

const PILL_STYLES = {
  applied:   "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer:     "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected:  "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

const PRIORITY_STYLES = {
  low:    "bg-stone-100 text-stone-500 border-stone-200",
  medium: "bg-amber-50  text-amber-600  border-amber-200",
  high:   "bg-rose-50   text-rose-600   border-rose-200",
};

function FieldLabel({ children }) {
  return (
    <label className="block text-[0.6rem] font-bold uppercase tracking-widest text-[#A8A29E] mb-1.5">
      {children}
    </label>
  );
}

function Input({ error, ...props }) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl text-sm bg-[#F7F5F2] border px-3 py-2.5 outline-none
        focus:ring-2 focus:ring-stone-200 focus:border-stone-400 transition-all
        placeholder:text-stone-300
        ${error ? "border-rose-300" : "border-[#E8E4DE]"}`}
    />
  );
}

function StyledSelect({ children, ...props }) {
  return (
    <select
      {...props}
      className="w-full rounded-xl text-sm bg-[#F7F5F2] border border-[#E8E4DE] px-3 py-2.5 outline-none focus:ring-2 focus:ring-stone-200 cursor-pointer"
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

export default function JobModal({ open, onClose, job }) {
  const { createJob, updateJob } = useJobStore();
  const isEdit = !!job;

  const [form, setForm]           = useState(emptyForm());
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [serverError, setServerError] = useState("");

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setServerError("");
    if (isEdit && job) {
      setForm({
        title:       job.title       || "",
        company:     job.company     || "",
        location:    job.location    || "",
        status:      job.status      || "applied",
        priority:    job.priority    || "medium",
        link:        job.link        || "",
        sourceUrl:   job.sourceUrl   || "",
        dateApplied: job.dateApplied?.slice(0, 10) || new Date().toISOString().slice(0, 10),
        tags:        Array.isArray(job.tags) ? job.tags.join(", ") : (job.tags || ""),
        starred:     Boolean(job.starred),
        archived:    Boolean(job.archived),
      });
    } else {
      setForm(emptyForm());
    }
  }, [open, job, isEdit]);

  if (!open) return null;

  const set = (key) => (e) => {
    const val = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: "" }));
  };

  const toggle = (key) => setForm((f) => ({ ...f, [key]: !f[key] }));

  const validate = () => {
    const errs = {};
    if (!form.title.trim())   errs.title   = "Required";
    if (!form.company.trim()) errs.company = "Required";
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    setServerError("");
    const payload = {
      ...form,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };
    const res = isEdit ? await updateJob(job.id, payload) : await createJob(payload);
    setSaving(false);
    if (res?.success) onClose();
    else setServerError(res?.error || "Something went wrong.");
  };

  const tagList = form.tags
    ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="w-full max-w-lg bg-white rounded-2xl border border-[#E8E4DE] shadow-2xl flex flex-col max-h-[90vh]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-[#EFEDE9]">
          <div>
            <h2 className="text-lg font-semibold font-['Lora'] text-stone-900">
              {isEdit ? "Edit Application" : "New Application"}
            </h2>
            <p className="text-xs text-[#A8A29E] mt-0.5">
              {isEdit ? `${job.title} · ${job.company}` : "Track a new opportunity"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
          {serverError && (
            <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3">
              <AlertCircle size={14} className="flex-shrink-0" /> {serverError}
            </div>
          )}

          {/* Title + Company */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel>Job Title *</FieldLabel>
              <Input placeholder="Software Engineer" value={form.title} onChange={set("title")} error={errors.title} />
              {errors.title && <p className="text-[0.62rem] text-rose-500 mt-1">{errors.title}</p>}
            </div>
            <div>
              <FieldLabel>Company *</FieldLabel>
              <Input placeholder="Acme Corp" value={form.company} onChange={set("company")} error={errors.company} />
              {errors.company && <p className="text-[0.62rem] text-rose-500 mt-1">{errors.company}</p>}
            </div>
          </div>

          {/* Location */}
          <div>
            <FieldLabel>Location</FieldLabel>
            <Input placeholder="Toronto, ON · Remote" value={form.location} onChange={set("location")} />
          </div>

          {/* Status + Priority + Date */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Status</FieldLabel>
              <StyledSelect value={form.status} onChange={set("status")}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </StyledSelect>
            </div>
            <div>
              <FieldLabel>Priority</FieldLabel>
              <StyledSelect value={form.priority} onChange={set("priority")}>
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                ))}
              </StyledSelect>
            </div>
            <div>
              <FieldLabel>Date Applied</FieldLabel>
              <Input type="date" value={form.dateApplied} onChange={set("dateApplied")} />
            </div>
          </div>

          {/* Live chip preview */}
          <div className="flex gap-2">
            <span className={`px-2.5 py-0.5 rounded-full border text-[0.6rem] font-bold uppercase tracking-wider ${PILL_STYLES[form.status]}`}>
              {form.status}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border text-[0.6rem] font-bold uppercase tracking-wider ${PRIORITY_STYLES[form.priority]}`}>
              {form.priority}
            </span>
          </div>

          {/* URLs */}
          <div>
            <FieldLabel>Job Posting URL</FieldLabel>
            <Input placeholder="https://linkedin.com/jobs/..." value={form.link} onChange={set("link")} />
          </div>
          <div>
            <FieldLabel>Source URL</FieldLabel>
            <Input placeholder="https://..." value={form.sourceUrl} onChange={set("sourceUrl")} />
          </div>

          {/* Tags */}
          <div>
            <FieldLabel>Tags (comma separated)</FieldLabel>
            <div className="relative">
              <Tag size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
              <Input
                className="pl-8"
                placeholder="remote, senior, fintech"
                value={form.tags}
                onChange={set("tags")}
                style={{ paddingLeft: "1.75rem" }}
              />
            </div>
            {tagList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tagList.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-500 text-[0.62rem]">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex gap-2 pt-1">
            {[
              {
                key: "starred",
                icon: <Star size={12} fill={form.starred ? "currentColor" : "none"} />,
                label: "Starred",
                active: form.starred,
                activeClass: "bg-amber-50 border-amber-200 text-amber-600",
              },
              ...(isEdit ? [{
                key: "archived",
                icon: <Archive size={12} />,
                label: "Archived",
                active: form.archived,
                activeClass: "bg-stone-100 border-stone-300 text-stone-600",
              }] : []),
            ].map(({ key, icon, label, active, activeClass }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  active ? activeClass : "text-stone-400 border-[#E8E4DE] hover:border-stone-300 bg-white"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex gap-3 bg-[#F7F5F2] border-t border-[#EFEDE9] rounded-b-2xl">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 border border-[#E8E4DE] rounded-xl py-2.5 text-sm font-medium text-stone-600 hover:bg-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-[#1C1917] text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving && (
              <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            )}
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Application"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}