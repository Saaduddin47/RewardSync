import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import api from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import DataTable from "../components/DataTable";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

const BGVDashboard = () => {
  const [rows, setRows] = useState([]);

  const load = async () => {
    const { data } = await api.get("/joiners/bgv-queue");
    setRows(data);
  };

  useEffect(() => {
    load();
  }, []);

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
            <Button variant="outline" onClick={() => updateStatus(row.original.joinerId, "cleared")}>Mark Cleared</Button>
            <Button variant="danger" onClick={() => updateStatus(row.original.joinerId, "failed")}>Mark Failed</Button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <DashboardLayout>
      <Card>
        <h3 className="mb-3 font-semibold">Joiners needing verification</h3>
        <DataTable columns={columns} data={rows} searchPlaceholder="Search joiners..." />
      </Card>
    </DashboardLayout>
  );
};

export default BGVDashboard;
