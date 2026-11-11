import { API_BASE_URL } from "@/src/lib/api";

export function resolveAvatarUrl(value: string | null | undefined): string | null {
  if (!value) return null;

  const apiUrl = new URL(API_BASE_URL);
  const rawValue = value.trim();
  const isRelativePath = !/^[a-z][a-z\d+.-]*:/i.test(rawValue) && !rawValue.startsWith("//");
  const normalizedPath = isRelativePath
    ? `/storage/${rawValue.replace(/^\/?(?:storage\/)?/, "")}`
    : rawValue;
  const avatarUrl = new URL(normalizedPath, apiUrl.origin);

  if (avatarUrl.hostname === apiUrl.hostname && avatarUrl.origin !== apiUrl.origin) {
    return new URL(`${avatarUrl.pathname}${avatarUrl.search}${avatarUrl.hash}`, apiUrl.origin).toString();
  }

  return avatarUrl.toString();
}
