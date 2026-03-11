import { cn } from "../../utils/cn";

const map = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  cleared: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
  not_claimed: "bg-slate-100 text-slate-700",
};

export const Badge = ({ status = "pending" }) => (
  <span className={cn("rounded-full px-2 py-1 text-xs font-medium capitalize", map[status] || "bg-slate-100 text-slate-700")}>{status.replace("_", " ")}</span>
);
