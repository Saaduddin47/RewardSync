import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";

const ManagerDashboard = () => {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    const [claimsRes, statsRes] = await Promise.all([api.get("/claims"), api.get("/dashboard/manager")]);
    setClaims(claimsRes.data);
    setStats(statsRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, action) => {
    try {
      await api.patch(`/claims/${id}/decision`, { action });
      toast.success(`Claim ${action}ed`);
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    }
  };

  const filtered = statusFilter === "all" ? claims : claims.filter((c) => c.status === statusFilter);

  const columns = useMemo(
    () => [
      { header: "Recruiter", cell: ({ row }) => row.original.recruiterId?.name },
      { header: "Joiner", cell: ({ row }) => row.original.joinerId?.joinerName },
      { header: "Client", cell: ({ row }) => row.original.joinerId?.client },
      { accessorKey: "incentiveType", header: "Incentive Type" },
      { header: "BGV", cell: ({ row }) => <Badge status={row.original.bgvStatus} /> },
      { accessorKey: "tenure", header: "Tenure (Months)" },
      {
        header: "Recovery Status",
        cell: ({ row }) => (row.original.recoveryDeficit > 0 ? `Deficit ${row.original.recoveryDeficit}` : "Clear"),
      },
      { accessorKey: "status", header: "Final Status", cell: ({ row }) => <Badge status={row.original.status} /> },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" disabled={row.original.status !== "pending"} onClick={() => decide(row.original._id, "approve")}>
              Approve
            </Button>
            <Button variant="danger" disabled={row.original.status !== "pending"} onClick={() => decide(row.original._id, "reject")}>
              Reject
            </Button>
          </div>
        ),
      },
    ],
    []
  );

  const exportReport = async () => {
    const response = await api.get("/export-report", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement("a");
    a.href = url;
    a.download = "incentive-report.xlsx";
    a.click();
  };

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pending" value={stats.pending} />
        <StatCard title="Approved" value={stats.approved} />
        <StatCard title="Rejected" value={stats.rejected} />
      </div>

      <Card className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-semibold">Incentive Claims</h3>
          <div className="flex items-center gap-2">
            <select className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <Button onClick={exportReport}>Export Excel</Button>
          </div>
        </div>
        <DataTable columns={columns} data={filtered} searchPlaceholder="Search claims..." />
      </Card>
    </DashboardLayout>
  );
};

export default ManagerDashboard;
