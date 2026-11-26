import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button } from "@/src/components/ui/Button";

export const panelClass = "min-w-0 rounded-2xl border border-[#DFE6F3] bg-white p-4 shadow-sm sm:p-6";
export const fieldClass = "mt-1 min-h-11 w-full min-w-0 rounded-lg border border-[#B8C2D3] bg-white px-3 py-2 text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]";
export const focusClass = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]";
export const linkClass = `inline-flex min-h-11 items-center font-semibold text-[#A04100] hover:underline ${focusClass}`;

export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <h1 className="font-display text-3xl font-bold tracking-tight text-[#121C2A] sm:text-4xl">{title}</h1>
      {children}
    </header>
  );
}

export function ActionButton({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <Button variant="secondary" {...props} className={`min-h-11 bg-[#121C2A] hover:bg-[#263449] focus:ring-[#A04100] disabled:cursor-not-allowed disabled:opacity-50 ${className}`} />;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block min-w-0 text-sm font-semibold text-[#263449]">{label}{children}</label>;
}

export function RequestError({ message, retry }: { message?: string; retry?: () => void }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
      <p>{message}</p>
      {retry && <button type="button" className={`mt-2 min-h-11 font-semibold underline ${focusClass}`} onClick={retry}>Coba lagi</button>}
    </div>
  );
}

export function LoadingData() {
  return <p role="status" className={panelClass}>Memuat data...</p>;
}

export function Pagination({ current, last, onChange }: { current: number; last: number; onChange: (page: number) => void }) {
  if (last <= 1) return null;
  return (
    <nav aria-label="Halaman data" className="flex flex-wrap items-center gap-3">
      <ActionButton disabled={current <= 1} onClick={() => onChange(current - 1)}>Sebelumnya</ActionButton>
      <span className="text-sm">Halaman {current} dari {last}</span>
      <ActionButton disabled={current >= last} onClick={() => onChange(current + 1)}>Selanjutnya</ActionButton>
    </nav>
  );
}
