import type { User } from "./types";

export const normalizePersonSearch = (value: string) =>
  value
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u064B-\u065F\u0670ـ]/g, "")
    .replace(/[\s\u200c]+/g, " ")
    .trim()
    .toLowerCase();

export function matchesPerson(user: User, query: string): boolean {
  const text = normalizePersonSearch(
    [user.name, user.username, user.position, user.unit]
      .filter(Boolean)
      .join(" "),
  );
  return normalizePersonSearch(query)
    .split(" ")
    .every((word) => text.includes(word));
}
