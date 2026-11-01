import type { TenantAddress } from "@/src/types/address";

const EMPTY_ADDRESS = "Alamat belum tersedia";

export function formatAddress(address: TenantAddress | string | null | undefined): string {
  if (typeof address === "string") {
    return address.trim() || EMPTY_ADDRESS;
  }

  if (!address) return EMPTY_ADDRESS;

  const postalCode = [address.postal_code, address["Kode Pos"]].find(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
  const parts = [address.street, address.city, address.province, postalCode]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .map((value) => value.trim());

  return parts.length > 0 ? parts.join(", ") : EMPTY_ADDRESS;
}
