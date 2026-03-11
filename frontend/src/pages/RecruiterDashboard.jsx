import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import api from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";
import { Skeleton } from "../components/ui/skeleton";

const schema = z.object({
  joinerName: z.string().min(2),
  client: z.string().min(2),
  skill: z.string().min(2),
  portal: z.string().min(2),
  joinDate: z.string().min(1),
  incentiveType: z.enum(["CTH", "FTE", "ANN"]),
});

const RecruiterDashboard = () => {
  const [stats, setStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { incentiveType: "CTH" },
  });

  const loadData = async () => {
    setLoading(true);
    const [statsRes, joinersRes] = await Promise.all([
      api.get("/dashboard/recruiter"),
      api.get("/joiners/my"),
    ]);
    setStats(statsRes.data);
    setRows(joinersRes.data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const onSubmit = async (values) => {
    try {
      await api.post("/joiners", values);
      toast.success("Joiner submitted");
      reset({ incentiveType: "CTH" });
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to submit joiner");
    }
  };

  const claim = async (joinerId) => {
    try {
      await api.post(`/claims/${joinerId}`);
      toast.success("Claim submitted");
      loadData();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Claim failed");
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "joinerName", header: "Joiner" },
      { accessorKey: "client", header: "Client" },
      { accessorKey: "incentiveType", header: "Type" },
      { accessorKey: "bgvStatus", header: "BGV", cell: ({ row }) => <Badge status={row.original.bgvStatus} /> },
      {
        header: "Eligibility",
        cell: ({ row }) => <Badge status={row.original.eligibility?.eligible ? "approved" : "pending"} />,
      },
      { accessorKey: "claimStatus", header: "Claim Status", cell: ({ row }) => <Badge status={row.original.claimStatus} /> },
      {
        header: "Action",
        cell: ({ row }) => (
          <Button
            variant="outline"
            disabled={!row.original.eligibility?.eligible || row.original.claimStatus !== "not_claimed"}
            onClick={() => claim(row.original._id)}
          >
            Claim
          </Button>
        ),
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-3">
        {loading || !stats ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <>
            <StatCard title="Quarterly Target" value={stats.quarterlyTarget} />
            <StatCard title="Joiners Submitted" value={stats.joinersSubmitted} />
            <StatCard title="Current Deficit" value={stats.currentDeficit} />
          </>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="mb-3 font-semibold">Submit Joiner</h3>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <Input placeholder="Joiner Name" {...register("joinerName")} />
            <Input placeholder="Client" {...register("client")} />
            <Input placeholder="Skill" {...register("skill")} />
            <Input placeholder="Portal" {...register("portal")} />
            <Input type="date" {...register("joinDate")} />
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" {...register("incentiveType")}>
              <option value="CTH">CTH</option>
              <option value="FTE">FTE</option>
              <option value="ANN">ANN</option>
            </select>
            <Button className="w-full" disabled={isSubmitting}>Submit</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold">My Joiners</h3>
          <DataTable columns={columns} data={rows} searchPlaceholder="Search joiners..." />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterDashboard;
