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
import DataTable from "../components/DataTable";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["recruiter", "bgv", "manager", "admin"]),
  empId: z.string().min(2),
  doj: z.string().min(1),
  quarterlyTarget: z.coerce.number().min(0),
  incentiveCTH: z.coerce.number().min(0),
  incentiveANN: z.coerce.number().min(0),
  password: z.string().min(6),
});

const AdminDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [recoveryRows, setRecoveryRows] = useState([]);
  const [recruiterFilter, setRecruiterFilter] = useState("all");

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: "recruiter", quarterlyTarget: 10, incentiveCTH: 0, incentiveANN: 0, password: "Pass@123" },
  });

  const load = async () => {
    const [employeesRes, recoveryRes] = await Promise.all([api.get("/admin/employees"), api.get("/admin/recovery")]);
    setEmployees(employeesRes.data);
    setRecoveryRows(recoveryRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (values) => {
    try {
      await api.post("/admin/employees", values);
      toast.success("Employee created");
      reset();
      load();
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create employee");
    }
  };

  const updateDeficit = async (row, deficit) => {
    await api.patch("/admin/recovery", {
      recruiterId: row.recruiterId._id,
      quarter: row.quarter,
      deficit: Number(deficit),
    });
    toast.success("Deficit updated");
    load();
  };

  const recruiters = employees.filter((employee) => employee.role === "recruiter");
  const filteredRecovery = recruiterFilter === "all"
    ? recoveryRows
    : recoveryRows.filter((row) => row.recruiterId?._id === recruiterFilter);

  const columns = useMemo(
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

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="mb-3 font-semibold">Create Employee</h3>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <Input placeholder="Name" {...register("name")} />
            <Input placeholder="Email" {...register("email")} />
            <select className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" {...register("role")}>
              <option value="recruiter">Recruiter</option>
              <option value="bgv">BGV</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            <Input placeholder="Emp ID" {...register("empId")} />
            <Input type="date" {...register("doj")} />
            <Input type="number" placeholder="Quarterly Target" {...register("quarterlyTarget")} />
            <Input type="number" placeholder="CTH Incentive Amount" {...register("incentiveCTH")} />
            <Input type="number" placeholder="ANN Incentive Amount" {...register("incentiveANN")} />
            <Input type="password" placeholder="Password" {...register("password")} />
            <Button className="w-full" disabled={isSubmitting}>Create Employee</Button>
          </form>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Recovery Management</h3>
            <select
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
              value={recruiterFilter}
              onChange={(e) => setRecruiterFilter(e.target.value)}
            >
              <option value="all">All Recruiters</option>
              {recruiters.map((recruiter) => (
                <option key={recruiter._id} value={recruiter._id}>{recruiter.name}</option>
              ))}
            </select>
          </div>
          <DataTable columns={columns} data={filteredRecovery} searchPlaceholder="Search recovery..." />
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
