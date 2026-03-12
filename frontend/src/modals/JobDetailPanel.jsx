import { useEffect, useState } from "react";
import {
  X,
  Pin,
  Trash2,
  Pencil,
  Check,
  Plus,
  ChevronDown,
  Star,
  Archive,
  ExternalLink,
  Bell,
  CheckCircle2,
  StickyNote,
  History,
  Clock,
  FileText,
  UploadCloud,
  FolderOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useJobNotesStore } from "../store/jobNoteStore";
import useJobStore from "../store/jobStore";
import { jobApi } from "../api/jobApi";

const STATUSES = ["applied", "interview", "offer", "rejected"];

const PILL_STYLES = {
  applied: "bg-[#EFF6FF] text-[#1D4ED8] border-[#DBEAFE]",
  interview: "bg-[#FEF3C7] text-[#B45309] border-[#FDE68A]",
  offer: "bg-[#EAF4EF] text-[#2D6A4F] border-[#BBF7D0]",
  rejected: "bg-[#FFF1F2] text-[#BE123C] border-[#FECDD3]",
};

const TIMELINE_DOT = {
  applied: "bg-blue-400",
  interview: "bg-amber-400",
  offer: "bg-emerald-400",
  rejected: "bg-rose-400",
  created: "bg-stone-300",
};

const PRIORITY_STYLES = {
  low: "text-stone-400",
  medium: "text-amber-500",
  high: "text-rose-500",
};

function TabBtn({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-3 text-[0.75rem] font-bold uppercase tracking-widest transition-all border-b-2 ${
        active
          ? "border-stone-900 text-stone-900"
          : "border-transparent text-[#A8A29E] hover:text-stone-600"
      }`}
    >
      {children}
      {count > 0 && (
        <span
          className={`rounded-full px-1.5 py-0 text-[0.55rem] font-bold ${active ? "bg-stone-900 text-white" : "bg-stone-200 text-stone-500"}`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function NotesTab({ job }) {
  const { byJobId, addNote, updateNote, deleteNote } = useJobNotesStore();
  const bucket = byJobId[job.id];
  const notes = bucket?.items || [];
  const loading = bucket?.loading;

  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);
  const [remindAt, setRemindAt] = useState("");
  const [showRemind, setShowRemind] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const handleAdd = async () => {
    if (!text.trim()) return;
    setAdding(true);
    await addNote(job.id, {
      text: text.trim(),
      pinned,
      remindAt: remindAt || null,
    });
    setText("");
    setPinned(false);
    setRemindAt("");
    setShowRemind(false);
    setAdding(false);
  };

  const saveEdit = async (note) => {
    if (!editText.trim()) return;
    await updateNote(job.id, note.id, { text: editText.trim() });
    setEditingId(null);
  };

  const togglePin = (note) =>
    updateNote(job.id, note.id, { pinned: !note.pinned });

  const markDone = async (note) => {
    const { jobNoteApi } = await import("../api/jobNoteApi");
    await jobNoteApi.done(note.id, !note.doneAt);
    fetchNotes(job.id, { page: 1, limit: 50 });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-[#EFEDE9]">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Add a note… (⌘↵ to save)"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAdd();
          }}
          className="w-full rounded-xl bg-[#F7F5F2] border border-[#E8E4DE] px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-stone-200 resize-none placeholder:text-stone-300 transition-all"
        />
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <button
            onClick={() => setPinned(!pinned)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[0.65rem] font-semibold transition-all ${
              pinned
                ? "bg-amber-50 border-amber-200 text-amber-600"
                : "bg-white border-[#E8E4DE] text-stone-400 hover:border-stone-300"
            }`}
          >
            <Pin size={10} fill={pinned ? "currentColor" : "none"} /> Pin
          </button>

          {showRemind && (
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              className="text-[0.65rem] bg-[#F7F5F2] border border-[#E8E4DE] rounded-lg px-2 py-1 outline-none"
            />
          )}

          <button
            onClick={handleAdd}
            disabled={!text.trim() || adding}
            className="ml-auto flex items-center gap-1.5 bg-[#1C1917] text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-40 hover:bg-black transition-all active:scale-95"
          >
            {adding ? (
              <span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Plus size={11} />
            )}
            Add
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading && !notes.length && (
          <p className="text-center text-stone-300 text-sm py-8 animate-pulse">
            Loading…
          </p>
        )}
        {!loading && !notes.length && (
          <div className="text-center py-10 text-stone-300">
            <StickyNote size={24} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No notes yet</p>
          </div>
        )}
        <AnimatePresence>
          {notes.map((note) => (
            <motion.div
              key={note.id}
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className={`rounded-xl border p-3 transition-all group ${
                note.pinned
                  ? "bg-amber-50/60 border-amber-200"
                  : note.doneAt
                    ? "bg-[#FAFAF9] border-[#EFEDE9] opacity-60"
                    : "bg-white border-[#E8E4DE]"
              }`}
            >
              {editingId === note.id ? (
                <div className="flex flex-col gap-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    autoFocus
                    rows={2}
                    className="w-full text-sm bg-[#F7F5F2] border border-[#E8E4DE] rounded-lg px-2.5 py-2 outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveEdit(note)}
                      className="px-3 py-1 rounded-lg bg-stone-900 text-white text-xs font-semibold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2.5 py-1 rounded-lg text-stone-400 text-xs border border-[#E8E4DE] hover:bg-stone-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p
                    className={`text-sm leading-relaxed ${note.doneAt ? "line-through text-stone-400" : "text-stone-700"}`}
                  >
                    {note.text}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2 text-[0.75rem] text-stone-400">
                      {note.pinned && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Pin size={8} fill="currentColor" /> pinned
                        </span>
                      )}
                      {note.remindAt && (
                        <span className="flex items-center gap-0.5 text-blue-400">
                          <Bell size={8} />
                          {new Date(note.remindAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                      {note.edited && (
                        <span className="text-stone-300">edited</span>
                      )}
                      <span>
                        {new Date(note.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                      {[
                        {
                          icon: (
                            <CheckCircle2
                              size={12}
                              className={note.doneAt ? "text-emerald-500" : ""}
                            />
                          ),
                          fn: () => markDone(note),
                          title: "Toggle done",
                        },
                        {
                          icon: <Pin size={12} />,
                          fn: () => togglePin(note),
                          title: "Toggle pin",
                        },
                        {
                          icon: <Pencil size={12} />,
                          fn: () => {
                            setEditingId(note.id);
                            setEditText(note.text);
                          },
                          title: "Edit",
                        },
                        {
                          icon: <Trash2 size={12} />,
                          fn: () => deleteNote(job.id, note.id),
                          title: "Delete",
                          danger: true,
                        },
                      ].map((btn, i) => (
                        <button
                          key={i}
                          onClick={btn.fn}
                          title={btn.title}
                          className={`w-6 h-6 flex items-center justify-center rounded-md transition-all text-stone-300 ${btn.danger ? "hover:bg-rose-50 hover:text-rose-500" : "hover:bg-stone-100 hover:text-stone-600"}`}
                        >
                          {btn.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

function TimelineTab({ job }) {
  const { timelines, fetchTimeLine } = useJobStore();
  const timeline = timelines[job.id] || [];
  const [loading, setLoading] = useState(!timelines[job.id]);

  useEffect(() => {
    const load = async () => {
      await fetchTimeLine(job.id);
      setLoading(false);
    };
    load();
  }, [job.id]);

  if (loading) {
    return (
      <p className="text-center text-stone-300 text-sm py-10 animate-pulse">
        Loading timeline…
      </p>
    );
  }

  if (!timeline.length) {
    return (
      <div className="text-center py-10 text-stone-300">
        <History size={24} className="mx-auto mb-2 opacity-40" />
        <p className="text-sm">No history yet</p>
      </div>
    );
  }

  return (
    <div className="p-5 space-y-0">
      {timeline.map((event, i) => {
        const statusKey = event.label?.split(" ").pop()?.toLowerCase();
        const dotClass =
          TIMELINE_DOT[event.type === "created" ? "created" : statusKey] ||
          "bg-stone-400";

        return (
          <div key={i} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 ${dotClass}`}
              />
              {i < timeline.length - 1 && (
                <div className="w-px flex-1 bg-[#EFEDE9] my-1 min-h-[20px]" />
              )}
            </div>
            <div className="pb-5">
              <p className="text-sm font-medium text-stone-700">
                {event.label}
              </p>
              <p className="text-[0.65rem] text-stone-400 mt-0.5 flex items-center gap-1">
                <Clock size={9} />
                {new Date(event.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function DocumentsTab({ job }) {
  const { uploadDocuments, deleteDocuments } = useJobStore();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [files, setFiles] = useState({ resume: null, coverLetter: null });
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState({ message: "", error: "" });

  const documents = Array.isArray(job.documents) ? job.documents : [];

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!files.resume && !files.coverLetter) return;
    setUploading(true);
    const result = await uploadDocuments(job.id, files);
    if (result.success) {
      setStatus({ message: "Saved successfully", error: "" });
      setFiles({ resume: null, coverLetter: null });
    } else {
      setStatus({ error: result.error || "Upload failed", message: "" });
    }
    setUploading(false);
  };

  if (selectedDoc) {
    return (
      <div className="flex flex-col h-full bg-[#F7F5F2]">
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#EFEDE9]">
          <button
            onClick={() => setSelectedDoc(null)}
            className="flex items-center gap-2 text-[0.65rem] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-900 transition-all"
          >
            <X size={14} /> Close Preview
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-medium text-stone-400 truncate max-w-[150px]">
              {selectedDoc.fileName}
            </span>
            <a
              href={selectedDoc.url}
              target="_blank"
              rel="noreferrer"
              className="text-stone-400 hover:text-stone-900"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
        <div className="flex-1 bg-stone-200">
          <iframe
            src={`${selectedDoc.url}#toolbar=0&navpanes=0`}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#FBFBFA]">
      <div className="p-4 border-b border-[#EFEDE9] bg-white">
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {["resume", "coverLetter"].map((type) => (
              <label
                key={type}
                className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 border-dashed transition-all cursor-pointer ${files[type] ? "border-stone-900 bg-stone-50" : "border-stone-200 hover:border-stone-400 bg-stone-50/50"}`}
              >
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) =>
                    setFiles((prev) => ({
                      ...prev,
                      [type]: e.target.files?.[0],
                    }))
                  }
                />
                <UploadCloud
                  size={18}
                  className={files[type] ? "text-stone-900" : "text-stone-300"}
                />
                <p className="text-[9px] font-bold uppercase mt-1 text-stone-500">
                  {type === "resume" ? "Resume" : "Cover Letter"}
                </p>
                {files[type] && (
                  <p className="text-[8px] text-stone-900 font-bold truncate mt-1 w-full text-center">
                    {files[type].name}
                  </p>
                )}
              </label>
            ))}
          </div>

          {(files.resume || files.coverLetter) && (
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
            >
              {uploading ? "Uploading..." : "Save Documents"}
            </button>
          )}
        </form>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h4 className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">
          Vault
        </h4>
        {documents.map((doc, i) => (
          <div
            key={i}
            className="group flex items-center justify-between p-3 bg-white border border-[#EFEDE9] rounded-xl hover:border-stone-400 transition-all"
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${doc.type === "resume" ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"}`}
              >
                <FileText size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-stone-800 capitalize">
                  {doc.type?.replace("_", " ")}
                </p>
                <p className="text-[10px] text-stone-400">{doc.fileName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  setSelectedDoc({ url: doc.fileUrl, fileName: doc.fileName })
                }
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase text-stone-500 hover:bg-stone-50 hover:text-stone-900 transition-all"
              >
                Preview
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (
                    window.confirm(
                      "Are you sure you want to remove this document?",
                    )
                  ) {
                    await deleteDocuments(job.id, doc._id);
                  }
                }}
                className="p-1.5 text-stone-300 hover:text-rose-600 transition-colors"
                title="Delete Document"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusDropdown({ job, onStatusChange, busy }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[0.62rem] font-bold uppercase tracking-wider transition-all ${PILL_STYLES[job.status]} ${busy ? "opacity-60" : "hover:opacity-75"}`}
      >
        {busy && (
          <span className="w-2.5 h-2.5 rounded-full border border-current/30 border-t-current animate-spin" />
        )}
        {job.status}
        <ChevronDown size={9} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.1 }}
              className="absolute top-full left-0 mt-1.5 bg-white border border-[#E8E4DE] rounded-xl shadow-lg z-20 overflow-hidden min-w-[140px]"
            >
              {STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setOpen(false);
                    onStatusChange(s);
                  }}
                  className={`w-full text-left px-3.5 py-2.5 text-xs font-medium capitalize flex items-center gap-2 transition-colors hover:bg-stone-50 ${
                    s === job.status
                      ? "text-stone-900 bg-stone-50 font-semibold"
                      : "text-stone-500"
                  }`}
                >
                  {s === job.status && (
                    <Check size={10} className="text-stone-400" />
                  )}
                  {s !== job.status && <span className="w-[10px]" />}
                  {s}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function JobDetailPanel({ job, onClose, onEdit }) {
  const { statusUpdate, toggleStarred, toggleArchived, jobs } = useJobStore();
  const { byJobId, loadNotesIfNeeded } = useJobNotesStore();
  const [tab, setTab] = useState("notes");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const liveJob = jobs.find((j) => j.id === job?.id) || job;
  const noteCount = byJobId[liveJob?.id]?.items?.length || 0;
  const documentCount = Array.isArray(liveJob?.documents)
    ? liveJob.documents.length
    : 0;

  if (!liveJob) return null;

  const handleStatusChange = async (s) => {
    if (s === liveJob.status) return;
    setUpdatingStatus(true);
    await statusUpdate(liveJob.id, s);
    setUpdatingStatus(false);
  };

  useEffect(() => {
    if (!liveJob?.id) return;
    loadNotesIfNeeded(liveJob.id, { page: 1, limit: 50 });
  }, [liveJob?.id, loadNotesIfNeeded]);

  return (
    <motion.div
      initial={{ x: "100%", opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: "100%", opacity: 0 }}
      transition={{ type: "spring", stiffness: 310, damping: 32 }}
      className="fixed right-0 top-[60px] h-[calc(100vh-60px)] w-full max-w-[500px] bg-white border-l border-[#E8E4DE] shadow-2xl z-40 flex flex-col"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className="px-5 pt-5 pb-4 border-b border-[#EFEDE9]">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0 pr-3">
            <h2 className="font-semibold font-['Lora'] text-stone-900 text-xl leading-tight truncate">
              {liveJob.title}
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              {liveJob.company}
              {liveJob.location ? ` · ${liveJob.location}` : ""}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-all flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-3">
          <StatusDropdown
            job={liveJob}
            onStatusChange={handleStatusChange}
            busy={updatingStatus}
          />

          {liveJob.priority && (
            <span
              className={`text-[0.75rem] font-bold uppercase tracking-wider ${PRIORITY_STYLES[liveJob.priority]}`}
            >
              ▌ {liveJob.priority}
            </span>
          )}

          {liveJob.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-500 text-[0.75rem]"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            {
              label: liveJob.starred ? "Starred" : "Star",
              icon: (
                <Star
                  size={11}
                  fill={liveJob.starred ? "currentColor" : "none"}
                />
              ),
              onClick: () => toggleStarred(liveJob.id),
              active: liveJob.starred,
              activeClass: "bg-amber-50 border-amber-200 text-amber-600",
            },
            {
              label: liveJob.archived ? "Archived" : "Archive",
              icon: <Archive size={11} />,
              onClick: () => toggleArchived(liveJob.id),
              active: liveJob.archived,
              activeClass: "bg-stone-100 border-stone-300 text-stone-600",
            },
          ].map(({ label, icon, onClick, active, activeClass }) => (
            <button
              key={label}
              onClick={onClick}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[0.65rem] font-medium transition-all ${
                active
                  ? activeClass
                  : "text-stone-400 border-[#E8E4DE] hover:border-stone-300 hover:text-stone-600"
              }`}
            >
              {icon} {label}
            </button>
          ))}

          {liveJob.link && (
            <a
              href={
                liveJob.link.startsWith("http")
                  ? liveJob.link
                  : `https://${liveJob.link}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-[0.65rem] font-medium text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-all"
            >
              <ExternalLink size={11} /> Open
            </a>
          )}

          <button
            onClick={() => onEdit(liveJob)}
            className="ml-auto flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#E8E4DE] text-[0.65rem] font-medium text-stone-400 hover:text-stone-700 hover:border-stone-300 transition-all"
          >
            <Pencil size={11} /> Edit
          </button>
        </div>
      </div>

      <div className="flex border-b border-[#EFEDE9] px-2 overflow-x-auto">
        <TabBtn
          active={tab === "notes"}
          onClick={() => setTab("notes")}
          count={noteCount}
        >
          Notes
        </TabBtn>
        <TabBtn
          active={tab === "timeline"}
          onClick={() => setTab("timeline")}
          count={0}
        >
          Timeline
        </TabBtn>
        <TabBtn
          active={tab === "documents"}
          onClick={() => setTab("documents")}
          count={documentCount}
        >
          Documents
        </TabBtn>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {tab === "notes" && <NotesTab job={liveJob} />}
        {tab === "timeline" && (
          <div className="overflow-y-auto flex-1">
            <TimelineTab job={liveJob} />
          </div>
        )}
        {tab === "documents" && <DocumentsTab job={liveJob} />}
      </div>
    </motion.div>
  );
}
