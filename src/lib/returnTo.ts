// SMS destinations are item detail paths only; external redirects are rejected.
export function safeReturnTo(value: string | null | undefined): string {
  return value &&
    /^\/(tasks|projects)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/?$/i.test(
      value,
    )
    ? value
    : "/";
}
export function authDestination(page: string, target: string): string {
  const safe = safeReturnTo(target);
  return safe === "/" ? page : `${page}?returnTo=${encodeURIComponent(safe)}`;
}
