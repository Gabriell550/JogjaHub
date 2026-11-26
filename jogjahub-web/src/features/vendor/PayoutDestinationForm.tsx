"use client";

import { useState } from "react";
import { useApiAction, useApiQuery } from "@/src/hooks/useApiRequest";
import { apiPut, type Resource } from "@/src/lib/api";
import { ActionButton, Field, fieldClass, LoadingData, panelClass, RequestError } from "@/src/components/shared/OperationsUi";

type DestinationType = "bank" | "gopay" | "dana";
interface Destination {
  type: DestinationType;
  provider: string;
  number: string;
  holder: string;
}

const endpoint = "/tenant/demo-payout-destination";

function DestinationFields({ destination }: { destination: Destination | null }) {
  const { busy, error, run } = useApiAction();
  const [type, setType] = useState<DestinationType>(destination?.type ?? "bank");
  const [bank, setBank] = useState(destination?.type === "bank" ? destination.provider : "");
  const [number, setNumber] = useState(destination?.number ?? "");
  const [holder, setHolder] = useState(destination?.holder ?? "");
  const [notice, setNotice] = useState("");

  return (
    <form className="space-y-4" onSubmit={(event) => {
      event.preventDefault();
      setNotice("");
      void run(async () => {
        const { data } = await apiPut<Resource<Destination>>(endpoint, {
          type,
          ...(type === "bank" ? { provider: bank.trim() } : {}),
          number,
          holder: holder.trim(),
        });
        setNumber(data.number);
        setHolder(data.holder);
        if (data.type === "bank") setBank(data.provider);
        setNotice("Tujuan pencairan disimpan. Muat ulang Pendapatan untuk melihat status terbaru.");
      });
    }}>
      <fieldset disabled={busy} className="grid min-w-0 gap-4 sm:grid-cols-2">
        <Field label="Jenis tujuan">
          <select className={fieldClass} value={type} onChange={(event) => setType(event.target.value as DestinationType)}>
            <option value="bank">Bank</option><option value="gopay">GoPay</option><option value="dana">DANA</option>
          </select>
        </Field>
        {type === "bank" && <Field label="Nama bank"><input className={fieldClass} required maxLength={50} placeholder="BCA" value={bank} onChange={(event) => setBank(event.target.value)} /></Field>}
        <Field label={type === "bank" ? "Nomor rekening (6–24 digit)" : "Nomor akun (6–24 digit)"}>
          <input className={fieldClass} required type="text" inputMode="numeric" pattern="[0-9]{6,24}" maxLength={24} placeholder="0000001234" value={number} onChange={(event) => setNumber(event.target.value)} />
        </Field>
        <Field label="Nama pemilik"><input className={fieldClass} required maxLength={100} placeholder="Pemilik Demo" value={holder} onChange={(event) => setHolder(event.target.value)} /></Field>
      </fieldset>
      <RequestError message={error} />
      {notice && <p role="status" className="text-sm text-green-800">{notice}</p>}
      <ActionButton type="submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan tujuan pencairan"}</ActionButton>
    </form>
  );
}

export function PayoutDestinationForm() {
  const query = useApiQuery<Resource<Destination | null>>(endpoint);
  return (
    <section id="tujuan-pencairan" className={`${panelClass} scroll-mt-20 space-y-4`}>
      <header className="space-y-1">
        <h2 className="font-display text-xl font-semibold">Tujuan Pencairan</h2>
        <p className="text-sm text-[#5A4136]">Mode demo · Pembayaran dan pencairan disimulasikan</p>
      </header>
      {query.loading && <LoadingData />}
      <RequestError message={query.error} retry={query.reload} />
      {query.data && <DestinationFields destination={query.data.data} />}
    </section>
  );
}
