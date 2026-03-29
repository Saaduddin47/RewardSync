import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import api, { fetchAdminDashboardData } from "../services/api";
import DashboardLayout from "../layouts/DashboardLayout";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import DataTable from "../components/DataTable";
import StatCard from "../components/StatCard";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["recruiter", "bgv", "manager"]),
  empId: z.string().min(2),
  doj: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  quarterlyTarget: z.coerce.number().min(0).optional(),
  incentiveCTH: z.coerce.number().min(0).optional(),
  incentiveANN: z.coerce.number().min(0).optional(),
  password: z.string().min(6),
});

const parseDmyToIso = (value) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value || "").trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const AdminDashboard = () => {
  const location = useLocation();
  const [employees, setEmployees] = useState([]);
  const [recoveryRows, setRecoveryRows] = useState([]);
  const [claims, setClaims] = useState([]);
  const [recruiterFilter, setRecruiterFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employeeDrafts, setEmployeeDrafts] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "recruiter", quarterlyTarget: 10, incentiveCTH: 0, incentiveANN: 0, password: "Pass@123", doj: "" },
    shouldUnregister: true,
  });

  const selectedCreateRole = watch("role");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const { employees: employeesData, recoveryRows: recoveryData, claims: claimsData } = await fetchAdminDashboardData();
      setEmployees(employeesData);
      setRecoveryRows(recoveryData);
      setClaims(claimsData);
      const initialDrafts = Object.fromEntries(
        employeesData.map((employee) => [
          employee._id,
          {
            name: employee.name || "",
            email: employee.email || "",
            role: employee.role || "recruiter",
            empId: employee.empId || "",
            doj: employee.doj ? new Date(employee.doj).toISOString().slice(0, 10) : "",
            quarterlyTarget: employee.quarterlyTarget || 0,
            incentiveCTH: employee.incentiveCTH || 0,
            incentiveANN: employee.incentiveANN || 0,
          },
        ])
      );
      setEmployeeDrafts(initialDrafts);
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load admin dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (values) => {
    try {
      const parsedDoj = parseDmyToIso(values.doj);
      if (!parsedDoj) {
        toast.error("Date of Joining must be in dd/mm/yyyy format");
        return;
      }

      const payload = {
        name: values.name,
        email: values.email,
        role: values.role,
        empId: values.empId,
        doj: parsedDoj,
        password: values.password,
      };

      if (values.role === "recruiter") {
        payload.quarterlyTarget = Number(values.quarterlyTarget || 0);
        payload.incentiveCTH = Number(values.incentiveCTH || 0);
        payload.incentiveANN = Number(values.incentiveANN || 0);
      }

      await api.post("/admin/employees", payload);
      toast.success("Employee created");
      reset({ role: "recruiter", quarterlyTarget: 10, incentiveCTH: 0, incentiveANN: 0, password: "Pass@123", doj: "" });
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create employee");
    }
  };

  const updateDeficit = async (row, deficit) => {
    try {
      await api.patch("/admin/recovery", {
        recruiterId: row.recruiterId._id,
        quarter: row.quarter,
        deficit: Number(deficit),
      });
      toast.success("Deficit updated");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update deficit");
    }
  };

  const saveEmployeeConfig = async (employeeId) => {
    const draft = employeeDrafts[employeeId];
    if (!draft) return;

    try {
      await api.patch(`/admin/employees/${employeeId}`, {
        name: draft.name,
        email: draft.email,
        role: draft.role,
        empId: draft.empId,
        doj: draft.doj,
        quarterlyTarget: Number(draft.quarterlyTarget || 0),
        incentiveCTH: Number(draft.incentiveCTH || 0),
        incentiveANN: Number(draft.incentiveANN || 0),
      });
      toast.success("Employee configuration updated");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update employee");
    }
  };

  const toggleEmployee = async (employeeId) => {
    try {
      await api.patch(`/admin/employees/${employeeId}/toggle-active`);
      toast.success("Employee status updated");
      await load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to update employee status");
    }
  };

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

  const updateEmployeeDraft = (employeeId, field, value) => {
    setEmployeeDrafts((prev) => ({
      ...prev,
      [employeeId]: {
        ...prev[employeeId],
        [field]: value,
      },
    }));
  };

  const recruiters = employees.filter((employee) => employee.role === "recruiter");
  const activeUsers = employees.filter((employee) => employee.isActive).length;
  const managerCount = employees.filter((employee) => employee.role === "manager").length;
  const bgvCount = employees.filter((employee) => employee.role === "bgv").length;
  const section = location.pathname.split("/")[2] || "dashboard";
  const showDashboard = section === "dashboard";
  const showEmployees = section === "employees";
  const showCreateUser = section === "create-user";
  const showRecovery = section === "recovery-management";
  const showSettings = section === "incentive-settings";
  const showExport = section === "export-report";

  const settingsEmployees = employees.filter((employee) => employee.role === "recruiter");
  const filteredRecovery = recruiterFilter === "all"
    ? recoveryRows
    : recoveryRows.filter((row) => row.recruiterId?._id === recruiterFilter);

  const recoveryColumns = useMemo(
    () => [
      { header: "Recruiter", cell: ({ row }) => row.original.recruiterId?.name },
      { accessorKey: "quarter", header: "Quarter" },
      {
        accessorKey: "deficit",
        header: "Deficit",
        cell: ({ row }) => (
          <Input
            type="number"
            defaultValue={row.original.deficit}
            onBlur={(e) => updateDeficit(row.original, e.target.value)}
          />
        ),
      },
    ],
    []
  );

  const employeeColumns = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => (
          <Input
            value={employeeDrafts[row.original._id]?.name ?? ""}
            onChange={(e) => updateEmployeeDraft(row.original._id, "name", e.target.value)}
          />
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <Input
            value={employeeDrafts[row.original._id]?.email ?? ""}
            onChange={(e) => updateEmployeeDraft(row.original._id, "email", e.target.value)}
          />
        ),
      },
      {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => (
          <select
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            value={employeeDrafts[row.original._id]?.role ?? "recruiter"}
            onChange={(e) => updateEmployeeDraft(row.original._id, "role", e.target.value)}
          >
            <option value="recruiter">Recruiter</option>
            <option value="bgv">BGV</option>
            <option value="manager">Manager</option>
          </select>
        ),
      },
      {
        accessorKey: "empId",
        header: "Emp ID",
        cell: ({ row }) => (
          <Input
            value={employeeDrafts[row.original._id]?.empId ?? ""}
            onChange={(e) => updateEmployeeDraft(row.original._id, "empId", e.target.value)}
          />
        ),
      },
      {
        accessorKey: "doj",
        header: "Date of Joining",
        cell: ({ row }) => (
          <Input
            type="date"
            value={employeeDrafts[row.original._id]?.doj ?? ""}
            onChange={(e) => updateEmployeeDraft(row.original._id, "doj", e.target.value)}
          />
        ),
      },
      {
        header: "Status",
        cell: ({ row }) => <Badge status={row.original.isActive ? "approved" : "rejected"} />,
      },
      {
        header: "Target",
        cell: ({ row }) => (
          <Input
            type="number"
            value={employeeDrafts[row.original._id]?.quarterlyTarget ?? 0}
            onChange={(e) => updateEmployeeDraft(row.original._id, "quarterlyTarget", e.target.value)}
          />
        ),
      },
      {
        header: "CTH",
        cell: ({ row }) => (
          <Input
            type="number"
            value={employeeDrafts[row.original._id]?.incentiveCTH ?? 0}
            onChange={(e) => updateEmployeeDraft(row.original._id, "incentiveCTH", e.target.value)}
          />
        ),
      },
      {
        header: "ANN",
        cell: ({ row }) => (
          <Input
            type="number"
            value={employeeDrafts[row.original._id]?.incentiveANN ?? 0}
            onChange={(e) => updateEmployeeDraft(row.original._id, "incentiveANN", e.target.value)}
          />
        ),
      },
      {
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => saveEmployeeConfig(row.original._id)}>Save</Button>
            <Button variant="outline" onClick={() => toggleEmployee(row.original._id)}>
              {row.original.isActive ? "Disable" : "Enable"}
            </Button>
          </div>
        ),
      },
    ],
    [employeeDrafts]
  );

  const claimsColumns = useMemo(
    () => [
      { header: "Joiner ID", cell: ({ row }) => row.original.joinerId?.joinerId || "-" },
      { header: "Joiner Name", cell: ({ row }) => row.original.joinerId?.joinerName || "-" },
      {
        header: "Date of Joining",
        cell: ({ row }) => {
          const joinDate = row.original.joinerId?.joinDate;
          return joinDate ? new Date(joinDate).toLocaleDateString() : "-";
        },
      },
      { header: "Recruiter", cell: ({ row }) => row.original.recruiterId?.name || "-" },
      { accessorKey: "incentiveType", header: "Type" },
      { accessorKey: "status", header: "Status", cell: ({ row }) => <Badge status={row.original.status} /> },
      { header: "Comment", cell: ({ row }) => row.original.comment || "—" },
    ],
    []
  );

  return (
    <DashboardLayout>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Total Employees" value={employees.length} />
        <StatCard title="Active Users" value={activeUsers} />
        <StatCard title="Managers" value={managerCount} />
        <StatCard title="BGV Team" value={bgvCount} />
      </div>

      {(showDashboard || showCreateUser || showRecovery) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          {(showDashboard || showCreateUser) && (
            <Card className="lg:col-span-1">
              <h3 className="mb-3 font-semibold">Create Employee</h3>
              <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
                <Input placeholder="Name" {...register("name")} />
                <Input placeholder="Email" {...register("email")} />
                <select className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground" {...register("role")}>
                  <option value="recruiter">Recruiter</option>
                  <option value="bgv">BGV</option>
                  <option value="manager">Manager</option>
                </select>
                <Input placeholder="Emp ID" {...register("empId")} />
                <Input type="text" placeholder="dd/mm/yyyy" {...register("doj")} />
                {selectedCreateRole === "recruiter" && (
                  <>
                    <Input type="number" placeholder="Quarterly Target" {...register("quarterlyTarget")} />
                    <Input type="number" placeholder="CTH Incentive Amount" {...register("incentiveCTH")} />
                    <Input type="number" placeholder="ANN Incentive Amount" {...register("incentiveANN")} />
                  </>
                )}
                <div className="relative">
                  <Input type={showPassword ? "text" : "password"} placeholder="Password" className="pr-10" {...register("password")} />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-2 inline-flex items-center text-foreground/60"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <Button className="w-full" disabled={isSubmitting}>Create Employee</Button>
              </form>
            </Card>
          )}

          {(showDashboard || showRecovery) && (
            <Card className="lg:col-span-2">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-semibold">Recovery Management</h3>
                <div className="flex gap-2">
                  <select
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    value={recruiterFilter}
                    onChange={(e) => setRecruiterFilter(e.target.value)}
                  >
                    <option value="all">All Recruiters</option>
                    {recruiters.map((recruiter) => (
                      <option key={recruiter._id} value={recruiter._id}>{recruiter.name}</option>
                    ))}
                  </select>
                  <Button onClick={exportReport}>Export Excel</Button>
                  <Button variant="outline" onClick={exportTrackerReport}>Download Tracker</Button>
                </div>
              </div>
              <DataTable
                columns={recoveryColumns}
                data={filteredRecovery}
                isLoading={loading}
                error={error}
                searchPlaceholder="Search recovery..."
                emptyMessage="No recovery rows yet"
              />
            </Card>
          )}
        </div>
      )}

      {(showDashboard || showEmployees) && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Employee Management</h3>
          <DataTable
            columns={employeeColumns}
            data={employees}
            isLoading={loading}
            error={error}
            searchPlaceholder="Search employees..."
            emptyMessage="No employees found"
          />
        </Card>
      )}

      {showDashboard && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Claims Overview</h3>
          <DataTable
            columns={claimsColumns}
            data={claims}
            isLoading={loading}
            error={error}
            searchPlaceholder="Search claims..."
            emptyMessage="No claims found"
          />
        </Card>
      )}

      {showSettings && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Incentive Settings</h3>
          <DataTable
            columns={employeeColumns}
            data={settingsEmployees}
            isLoading={loading}
            error={error}
            searchPlaceholder="Search recruiter settings..."
            emptyMessage="No recruiters found"
          />
        </Card>
      )}

      {showExport && (
        <Card className="mt-6">
          <h3 className="mb-3 font-semibold">Export Report</h3>
          <div className="flex flex-wrap gap-3">
            <Button onClick={exportReport}>Export Incentive Report</Button>
            <Button variant="outline" onClick={exportTrackerReport}>Download Incentive Tracker</Button>
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
};

export default AdminDashboard;
