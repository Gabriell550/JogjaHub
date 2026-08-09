// Dipakai di customer/booking (pilih slot) & vendor/calendar (atur kapasitas slot).
import React from 'react';
type Props = { availableSlots: string[]; onSelect: (slot: string) => void };
export function SlotPicker({ availableSlots, onSelect }: Props) {
  // TODO: render list slot waktu, termasuk slot dini hari
  return null;
}
