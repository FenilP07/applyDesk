import useJobStore from "../store/jobStore";

const STATUS_STYLES = {
  applied: {
    background: "#EFF6FF",
    color: "#1D4ED8",
    border: "1px solid #DBEAFE",
  },
  interview: {
    background: "#FEF3C7",
    color: "#B45309",
    border: "1px solid #FDE68A",
  },
  offer: {
    background: "#EAF4EF",
    color: "#2D6A4F",
    border: "1px solid #BBF7D0",
  },
  rejected: {
    background: "#FFF1F2",
    color: "#BE123C",
    border: "1px solid #FECDD3",
  },
};

export default function SelectStatus({ job }) {
  const { statusUpdate } = useJobStore();
  const style = STATUS_STYLES[job.status] ?? {
    background: "#F5F5F4",
    color: "#78716C",
    border: "1px solid #E7E5E4",
  };
  const handleChange = (e) => {
    const newStatus = e.target.value;
    if (newStatus === job.status) return;

    statusUpdate(job.id, { status: newStatus    });
  };

  return (
    <select
      value={job.status}
      onChange={handleChange}
      className="rounded-full text-[0.62rem] font-semibold uppercase outline-none cursor-pointer transition-all duration-200 hover:scale-105"
      style={{
        padding: "4px 10px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        background: style.background,
        color: style.color,
        border: style.border,
        appearance: "none",
      }}
    >
      <option value="applied">Applied</option>
      <option value="interview">Interview</option>
      <option value="offer">Offer</option>
      <option value="rejected">Rejected</option>
    </select>
  );
}
