import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api, { fetchRecruiterDashboardData } from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import { Skeleton } from "../components/ui/skeleton";

const schema = z.object({
  joinerId: z.string().min(1),
  joinerName: z.string().min(2),
  client: z.string().min(2),
  skill: z.string().min(2),
  portal: z.string().min(2),
  joinDate: z.string().min(1),
  incentiveType: z.enum(["CTH", "FTE", "ANN"]),
});

const RecruiterDashboard = () => {
  const location = useLocation();
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [claimErrors, setClaimErrors] = useState({});

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { incentiveType: "CTH" },
  });

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const { stats: dashboardStats, joiners } = await fetchRecruiterDashboardData();
      setStats(dashboardStats);
      setRows(joiners);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load recruiter dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values) => {
    setSubmitError("");
    try {
      await api.post("/joiners", values);
      toast.success("Joiner submitted");
      reset({ incentiveType: "CTH" });
      await loadData();
    } catch (e) {
      const message = e?.response?.data?.message || "Failed to submit joiner";
      setSubmitError(message);
      toast.error(message);
    }
  };

  const claim = async (joinerId) => {
    setClaimErrors((prev) => ({ ...prev, [joinerId]: "" }));
    try {
      await api.post(`/claims/${joinerId}`);
      toast.success("Claim submitted");
      setClaimErrors((prev) => ({ ...prev, [joinerId]: "" }));
      await loadData();
    } catch (e) {
      const message = e?.response?.data?.message || "Claim failed";
      setClaimErrors((prev) => ({ ...prev, [joinerId]: message }));
      toast.error(message);
    }
  };

  const progress = stats?.quarterlyTarget
    ? Math.min(100, Math.round(((stats.joinersSubmitted || 0) / stats.quarterlyTarget) * 100))
    : 0;
  const section = location.pathname.split("/")[2] || "dashboard";
  const showDashboard = section === "dashboard";
  const showSubmit = section === "submit-joiner";
  const showMyClaims = section === "my-claims";
  const showTargetProgress = section === "target-progress";

  const claimedRows = rows.filter((row) => row.claimStatus !== "not_claimed");

  const columns = useMemo(
    () => [
      { accessorKey: "joinerId", header: "Joiner ID" },
      { accessorKey: "joinerName", header: "Joiner" },
      {
        accessorKey: "joinDate",
        header: "Date of Joining",
        cell: ({ row }) => new Date(row.original.joinDate).toLocaleDateString(),
      },
      { accessorKey: "client", header: "Client" },
      { accessorKey: "incentiveType", header: "Type" },
      { accessorKey: "bgvStatus", header: "BGV", cell: ({ row }) => <Badge status={row.original.bgvStatus} /> },
      {
        header: "Comment",
        cell: ({ row }) => row.original.comment || "—",
      },
      {
        header: "Action",
        cell: ({ row }) => {
          const canClaim = row.original.claimStatus === "not_claimed" && row.original.bgvStatus === "cleared";
          const tooltipText = row.original.bgvStatus !== "cleared" ? "BGV must be cleared first" : "";

          return (
            <div className="space-y-1">
              <Button
                variant="outline"
                disabled={!canClaim}
                onClick={() => claim(row.original._id)}
                title={tooltipText}
              >
                Claim
              </Button>
              {claimErrors[row.original._id] && (
                <p className="max-w-xs text-xs text-red-500">{claimErrors[row.original._id]}</p>
              )}
            </div>
          );
        },
      },
    ],
    [claimErrors]
  );

  const claimsColumns = columns;

  return (
    <DashboardLayout>
      {(showDashboard || showTargetProgress) && (
        <div className="grid gap-4 md:grid-cols-4">
          {loading || !stats ? (
            <>
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </>
          ) : (
            <>
              <StatCard title="Quarterly Target" value={stats.quarterlyTarget} />
              <StatCard title="Joiners Submitted" value={stats.joinersSubmitted} />
              <StatCard title="Current Deficit" value={stats.currentDeficit} />
              <StatCard title="Target Progress" value={`${progress}%`} />
            </>
          )}
        </div>
      )}

      {(showDashboard || showSubmit) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <h3 className="mb-3 font-semibold">Submit Joiner</h3>
            <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
              <Input placeholder="Joiner ID" {...register("joinerId")} />
              <Input placeholder="Joiner Name" {...register("joinerName")} />
              <Input placeholder="Client" {...register("client")} />
              <Input placeholder="Skill" {...register("skill")} />
              <Input placeholder="Portal" {...register("portal")} />
              <Input type="date" {...register("joinDate")} />
              <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" {...register("incentiveType")}>
                <option value="CTH">CTH</option>
                <option value="FTE">FTE</option>
                <option value="ANN">ANN</option>
              </select>
              {submitError && <p className="text-sm text-red-500">{submitError}</p>}
              <Button className="w-full" disabled={isSubmitting}>Submit</Button>
            </form>
          </Card>

          <Card className="lg:col-span-2">
            <h3 className="mb-3 font-semibold">My Joiners</h3>
            <DataTable
              columns={columns}
              data={rows}
              isLoading={loading}
              error={error}
              searchPlaceholder="Search joiners..."
              emptyMessage="No joiners submitted yet"
            />
          </Card>
        </div>
      )}

      {showMyClaims && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">My Claims</h3>
          <DataTable
            columns={claimsColumns}
            data={claimedRows}
            isLoading={loading}
            error={error}
            searchPlaceholder="Search claims..."
            emptyMessage="No claims found"
          />
        </Card>
      )}

      {showTargetProgress && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Target Progress Details</h3>
          <DataTable
            columns={columns}
            data={rows}
            isLoading={loading}
            error={error}
            searchPlaceholder="Search target records..."
            emptyMessage="No target records"
          />
        </Card>
      )}
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
