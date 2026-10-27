export function insertSmsParameter(
  value: string,
  token: string,
  start: number,
  end: number,
) {
  const next = value.slice(0, start) + token + value.slice(end);
  if (next.length > 1500) throw new Error("قالب پیامک حداکثر ۱۵۰۰ نویسه است.");
  return { value: next, caret: start + token.length };
}
