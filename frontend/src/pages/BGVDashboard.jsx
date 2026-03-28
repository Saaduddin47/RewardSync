import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import api from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import StatCard from "../components/StatCard";

const BGVDashboard = () => {
  const location = useLocation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const endpoint = location.pathname.includes("all-joiners") ? "/joiners/bgv-all" : "/joiners/bgv-queue";
      const { data } = await api.get(endpoint);
      setRows(data);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load BGV queue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [location.pathname]);

  const updateStatus = async (joinerId, status) => {
    try {
      await api.patch(`/joiners/${joinerId}/bgv`, { bgvStatus: status });
      toast.success(`Marked ${status}`);
      load();
    } catch {
      toast.error("Failed to update BGV");
    }
  };

  const columns = useMemo(
    () => [
      { accessorKey: "joinerId", header: "Joiner ID" },
      { accessorKey: "joinerName", header: "Joiner Name" },
      { accessorKey: "recruiter", header: "Recruiter" },
      { accessorKey: "client", header: "Client" },
      {
        accessorKey: "joinDate",
        header: "Join Date",
        cell: ({ row }) => new Date(row.original.joinDate).toLocaleDateString(),
      },
      { accessorKey: "bgvStatus", header: "BGV Status", cell: ({ row }) => <Badge status={row.original.bgvStatus} /> },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => updateStatus(row.original.joinerObjectId, "cleared")}>Mark Cleared</Button>
            <Button variant="danger" onClick={() => updateStatus(row.original.joinerObjectId, "failed")}>Mark Failed</Button>
          </div>
        ),
      },
    ],
    []
  );

  const pendingCount = rows.filter((row) => row.bgvStatus === "pending").length;
  const clearedCount = rows.filter((row) => row.bgvStatus === "cleared").length;
  const failedCount = rows.filter((row) => row.bgvStatus === "failed").length;

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Joiners" value={rows.length} />
        <StatCard title="Pending" value={pendingCount} />
        <StatCard title="Cleared" value={clearedCount} />
        <StatCard title="Failed" value={failedCount} />
      </div>
      <Card className="mt-6">
        <h3 className="mb-3 font-semibold">
          {location.pathname.includes("all-joiners") ? "All Joiners" : "Pending Verifications"}
        </h3>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={loading}
          error={error}
          searchPlaceholder="Search joiners..."
          emptyMessage="No pending BGV items"
        />
      </Card>
    </DashboardLayout>
  );
};

export default BGVDashboard;
