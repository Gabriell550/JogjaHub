"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/src/hooks/useAuth";
import { ROUTES } from "@/src/constants/routes";

export function ServiceBackLink() {
  const router = useRouter();
  const { session } = useAuth();

  function goBack() {
    const referrerIsInternal = document.referrer.startsWith(window.location.origin);
    if (window.history.length > 1 && referrerIsInternal) {
      router.back();
      return;
    }

    router.replace(
      session?.user.role === "customer" ? ROUTES.dashboard : `${ROUTES.home}#layanan`,
    );
  }

  return (
    <button
      type="button"
      onClick={goBack}
      className="inline-flex min-h-11 items-center gap-2 font-semibold text-[#A04100] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
    >
      <span aria-hidden="true">&larr;</span> Kembali
    </button>
  );
}
