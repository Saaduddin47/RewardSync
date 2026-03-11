import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values) => {
    try {
      const loggedInUser = await login(values.email, values.password);
      toast.success("Login successful");
      navigate(`/${loggedInUser.role === "bgv" ? "bgv" : loggedInUser.role}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md space-y-4">
        <h1 className="text-xl font-semibold">Recruitment Incentive Tracker</h1>
        <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <Input placeholder="Email" {...register("email")} />
            {errors.email && <p className="mt-1 text-xs text-red-500">Valid email is required</p>}
          </div>
          <div>
            <Input type="password" placeholder="Password" {...register("password")} />
            {errors.password && <p className="mt-1 text-xs text-red-500">Password is required</p>}
          </div>
          <Button className="w-full" disabled={isSubmitting}>Sign In</Button>
        </form>
        <p className="text-xs text-slate-500">Seed admin first using POST (not browser GET): /api/auth/seed-admin</p>
      </Card>
    </div>
  );
};

export default Login;
