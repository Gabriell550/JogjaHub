import { tenantLayout } from '../constants/theme/tenant';

export const dockRowMinHeight = 56;
export const dockPadding = 6;
export const dockGap = 4;
export const dockFooterPadding = 8;
export const closedDockHeight = dockRowMinHeight + 2 * (dockPadding + dockFooterPadding);

export function getTenantDockGeometry(safeWidth: number, count: number) {
  const margin = safeWidth < tenantLayout.narrowWidth ? 8 : 12;
  const standardWidth = Math.min(safeWidth - 2 * margin, tenantLayout.maxContentWidth);
  const standardSlot = (standardWidth - 2 * dockPadding - dockGap * (count - 1)) / count;
  const tight = standardSlot < tenantLayout.minTarget;
  const width = tight ? Math.max(0, safeWidth) : standardWidth;
  const padding = tight ? Math.min(dockPadding, Math.max(0, (safeWidth - tenantLayout.minTarget * count) / 2)) : dockPadding;
  const gap = tight ? 0 : dockGap;
  const rowWidth = width - 2 * padding;
  const slot = (rowWidth - gap * (count - 1)) / count;

  return { width, rowWidth, slot, gap };
}
