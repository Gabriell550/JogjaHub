import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import { ROUTES } from "@/src/constants/routes";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">JogjaHub</p>
          <h1 className="text-3xl font-bold text-slate-900">Sign in</h1>
        </div>

        <form className="space-y-4">
          <Input label="Email" name="email" type="email" placeholder="name@example.com" />
          <Input label="Password" name="password" type="password" placeholder="••••••••" />
          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.register} className="font-medium text-emerald-600 hover:text-emerald-700">
            Register here
          </Link>
        </p>
      </Card>
    </div>
  );
}
