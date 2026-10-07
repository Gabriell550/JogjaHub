"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { disputeMocks } from "@/src/features/admin/mocks/disputeMocks";
import type { Dispute, DisputeMessage } from "@/src/features/admin/types";

const statusStyles: Record<string, string> = {
  open: "bg-[#FFF8E1] text-[#8A6D00]",
  resolved: "bg-[#E6F4EA] text-[#1E7B34]",
};

function formatTime(value: string) {
  return new Date(value).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminDisputeDetailPage() {
  const params = useParams<{ uuid: string }>();
  const uuid = params?.uuid;

  const [dispute, setDispute] = useState<Dispute | null>(() =>
    disputeMocks.find((d) => d.uuid === uuid) ?? null,
  );
  const [messages, setMessages] = useState<DisputeMessage[]>(() =>
    disputeMocks.find((d) => d.uuid === uuid)?.messages ?? [],
  );
  const [draft, setDraft] = useState("");

  if (!dispute) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold text-[#121C2A]">Sengketa</h1>
        <div className="rounded-2xl border border-[#D3E2ED] bg-white p-6 text-center">
          <p className="text-sm text-[#5A4136]">Sengketa tidak ditemukan</p>
          <Link
            href="/admin/disputes"
            className="mt-4 inline-flex rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-[#121C2A] hover:bg-[#E85F00]"
          >
            Kembali ke Sengketa
          </Link>
        </div>
      </div>
    );
  }

  function handleSend() {
    if (!draft.trim()) return;
    if (!dispute) return;

    // TODO: ganti dengan panggilan API sungguhan ke adminApi.sendDisputeMessage(...) begitu backend siap.
    const newMessage: DisputeMessage = {
      id: Date.now(),
      dispute_id: dispute.messages[0]?.dispute_id ?? 0,
      sender_name: "Admin",
      sender_role: "admin",
      message: draft.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setDraft("");
  }

  function handleMarkResolved() {
    // TODO: ganti dengan panggilan API sungguhan ke adminApi.resolveDispute(...) begitu backend siap.
    if (!dispute) return;
    setDispute({ ...dispute, status: "resolved" });
  }

  const isResolved = dispute.status === "resolved";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin/disputes" className="text-sm text-[#A04100] underline">← Kembali ke Sengketa</Link>
          <h1 className="font-display mt-1 text-2xl font-bold text-[#121C2A]">{dispute.subject}</h1>
        </div>
        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[dispute.status] ?? "bg-[#F8F9FF] text-[#121C2A]"}`}>
          {dispute.status}
        </span>
      </div>

      <p className="text-sm italic text-[#5A4136]/60">Data contoh — belum terhubung ke backend.</p>

      <div className="rounded-2xl border border-[#D3E2ED] bg-white">
        <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto p-5">
          {messages.map((msg) => {
            const isAdmin = msg.sender_role === "admin";
            return (
              <div key={msg.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm ${isAdmin ? "bg-[#FF6B00] text-white" : "bg-[#F8F9FF] text-[#121C2A]"}`}>
                  <p className={`text-xs font-semibold ${isAdmin ? "text-white/80" : "text-[#A04100]"}`}>{msg.sender_name}</p>
                  <p className="mt-0.5">{msg.message}</p>
                  <p className={`mt-1 text-[10px] ${isAdmin ? "text-white/60" : "text-[#5A4136]/60"}`}>{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3 border-t border-[#E6EEFF] p-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            placeholder="Tulis balasan..."
            className="min-h-10 flex-1 rounded-md border border-[#D3E2ED] px-3 text-sm text-[#121C2A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A04100]"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="rounded-full bg-[#FF6B00] px-4 py-2 text-sm font-semibold text-[#121C2A] hover:bg-[#E85F00] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Kirim
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={handleMarkResolved}
        disabled={isResolved}
        className="rounded-full bg-[#1E7B34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#16602A] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isResolved ? "Sengketa Selesai" : "Tandai Selesai"}
      </button>
    </div>
  );
}