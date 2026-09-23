import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Input";
import Link from "next/link";
import { ROUTES } from "@/src/constants/routes";

export default function RegisterPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-lg p-8">
        <div className="mb-6 space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">JogjaHub</p>
          <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
        </div>

        <form className="grid gap-4 md:grid-cols-2">
          <Input label="Full name" name="fullName" placeholder="Your name" className="md:col-span-2" />
          <Input label="Email" name="email" type="email" placeholder="name@example.com" />
          <Input label="Phone" name="phone" type="tel" placeholder="08xxxxxxxxxx" />
          <Input label="Password" name="password" type="password" placeholder="••••••••" className="md:col-span-2" />
          <div className="md:col-span-2">
            <Button type="submit" className="w-full">
              Register
            </Button>
          </div>
        </form>

        <p className="mt-5 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href={ROUTES.login} className="font-medium text-emerald-600 hover:text-emerald-700">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
