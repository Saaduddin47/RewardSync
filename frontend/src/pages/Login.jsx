import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
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
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
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
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-10 text-foreground">
      <Card className="w-full max-w-xl space-y-7 border-border bg-background p-10 text-foreground">
        <div className="space-y-3">
          <p className="text-4xl font-bold tracking-tight text-foreground">RewardSync</p>
          <h1 className="text-3xl font-semibold tracking-tight">Login</h1>
          <p className="text-lg text-foreground/80">Enter your credentials to access your account.</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="mb-2 block text-lg font-semibold text-foreground">Email</label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="h-12 border-border bg-background px-4 text-base text-foreground"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">Valid email is required</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-2 block text-lg font-semibold text-foreground">Password</label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="h-12 border-border bg-background px-4 pr-12 text-base text-foreground"
                {...register("password")}
              />
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-3 flex items-center text-foreground/70 hover:text-foreground"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">Password is required</p>}
          </div>
          <div className="flex items-center justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              className="h-12 min-w-32 border-border bg-background px-6 text-base text-foreground"
              onClick={() => {
                reset();
                setShowPassword(false);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" className="h-12 min-w-32 px-6 text-base" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Login;
