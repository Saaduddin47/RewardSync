import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import api, { fetchManagerDashboardData } from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";

const ManagerDashboard = () => {
  const location = useLocation();
  const [claims, setClaims] = useState([]);
  const [deficits, setDeficits] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { claims: allClaims, stats: managerStats, deficits: recruiterDeficits } = await fetchManagerDashboardData();
      setClaims(allClaims);
      setStats(managerStats);
      setDeficits(recruiterDeficits);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load manager dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const decide = async (id, action) => {
    try {
      await api.patch(`/claims/${id}/decision`, { action });
      toast.success(`Claim ${action}ed`);
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Action failed");
    }
  };

  const filtered = statusFilter === "all" ? claims : claims.filter((c) => c.status === statusFilter);
  const section = location.pathname.split("/")[2] || "dashboard";
  const showDashboard = section === "dashboard";
  const showClaims = section === "incentive-claims";
  const showQueue = section === "approval-queue";
  const showReports = section === "reports";
  const queueRows = claims.filter((claim) => claim.status === "pending");

  const columns = useMemo(
    () => [
      { header: "Recruiter", cell: ({ row }) => row.original.recruiterId?.name },
      { header: "Joiner ID", cell: ({ row }) => row.original.joinerId?.joinerId || "-" },
      { header: "Joiner", cell: ({ row }) => row.original.joinerId?.joinerName },
      {
        header: "Date of Joining",
        cell: ({ row }) => {
          const joinDate = row.original.joinerId?.joinDate;
          return joinDate ? new Date(joinDate).toLocaleDateString() : "-";
        },
      },
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
        header: "Rejection Reason",
        cell: ({ row }) => {
          if (["rejected", "not_eligible"].includes(row.original.status)) {
            return row.original.managerNote || "—";
          }
          return "—";
        },
      },
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

  const deficitColumns = useMemo(
    () => [
      { accessorKey: "name", header: "Recruiter Name" },
      { accessorKey: "empId", header: "Employee ID" },
      {
        header: "Current Deficit",
        cell: ({ row }) => {
          const value = Number(row.original.deficit || 0);
          const toneClass = value >= 3
            ? "text-red-600 font-semibold"
            : value > 0
              ? "text-amber-600 font-semibold"
              : "text-emerald-600 font-semibold";
          const badgeStatus = value >= 3 ? "rejected" : value > 0 ? "pending" : "approved";
          return (
            <div className="flex items-center gap-2">
              <span className={toneClass}>{value}</span>
              <Badge status={badgeStatus} />
            </div>
          );
        },
      },
    ],
    []
  );

  const exportReport = async () => {
    try {
      const response = await api.get("/reports", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "incentive-report.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Report exported");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to export report");
    }
  };

  const exportTrackerReport = async () => {
    try {
      const response = await api.get("/reports/incentive-tracker", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = "incentive-tracker.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success("Tracker report exported");
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to export tracker report");
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Pending" value={stats.pending} />
        <StatCard title="Approved" value={stats.approved} />
        <StatCard title="Rejected" value={stats.rejected} />
      </div>

      {(showDashboard || showClaims) && (
        <>
          <Card className="mt-6">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-semibold">Incentive Claims</h3>
              <div className="flex items-center gap-2">
                <select className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button onClick={exportReport}>Export Excel</Button>
                <Button variant="outline" onClick={exportTrackerReport}>Download Tracker</Button>
              </div>
            </div>
            <DataTable
              columns={columns}
              data={filtered}
              isLoading={loading}
              error={error}
              searchPlaceholder="Search claims..."
              emptyMessage="No claims available"
            />
          </Card>

          <Card className="mt-6">
            <h3 className="mb-3 font-semibold">Recruiter Recovery Deficits</h3>
            <DataTable
              columns={deficitColumns}
              data={deficits}
              isLoading={loading}
              error={error}
              searchPlaceholder="Search recruiters..."
              emptyMessage="No recruiter deficits found"
            />
          </Card>
        </>
      )}

      {showQueue && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Approval Queue</h3>
          <DataTable
            columns={columns}
            data={queueRows}
            isLoading={loading}
            error={error}
            searchPlaceholder="Search pending claims..."
            emptyMessage="No pending approvals"
          />
        </Card>
      )}

      {showReports && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Reports</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportReport}>Export Incentive Report</Button>
            <Button variant="outline" onClick={exportTrackerReport}>Download Incentive Tracker</Button>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default ManagerDashboard;
