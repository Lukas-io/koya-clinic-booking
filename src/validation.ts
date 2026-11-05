export const MAX_BODY_BYTES = 16 * 1024;
export const MAX_KEY_LENGTH = 255;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DIGITS_PATTERN = /^\d+$/;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/;

export type ParsedJson = { ok: true; value: unknown } | { ok: false };

export type SlotInput = {
  id: string;
  provider: string;
  start: string;
  end: string;
  startMs: number;
};

export type BookingInput = {
  slotId: string;
  name: string;
  email: string;
};

type Validation<T> = { ok: true; value: T } | { ok: false; error: string };

export function parseJson(text: string): ParsedJson {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false };
  }
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  if (isRecord(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${entries.join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalise(text: string): string {
  const parsed = parseJson(text);
  return parsed.ok ? stableStringify(parsed.value) : text;
}

export function rateLimitEmail(parsed: ParsedJson): string | null {
  if (!parsed.ok || !isRecord(parsed.value)) return null;
  const email = parsed.value.email;
  if (typeof email !== "string") return null;
  const normalised = normaliseEmail(email);
  return normalised === "" ? null : normalised;
}

export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateBooking(parsed: ParsedJson): Validation<BookingInput> {
  if (!parsed.ok) return fail("request body must be valid JSON");
  if (!isRecord(parsed.value)) return fail("request body must be a JSON object");
  const slotId = trimmedString(parsed.value.slot_id);
  const name = trimmedString(parsed.value.name);
  const email = trimmedString(parsed.value.email);
  if (slotId === null) return fail("slot_id is required");
  if (name === null) return fail("name is required");
  if (email === null) return fail("email is required");
  if (!EMAIL_PATTERN.test(email)) return fail("email is not valid");
  return { ok: true, value: { slotId, name, email: email.toLowerCase() } };
}

export function validateReset(text: string): Validation<SlotInput[]> {
  const parsed = parseJson(text);
  if (!parsed.ok) return fail("request body must be valid JSON");
  if (!isRecord(parsed.value) || !Array.isArray(parsed.value.slots)) {
    return fail("slots must be an array");
  }
  const slots: SlotInput[] = [];
  const seen = new Set<string>();
  for (const item of parsed.value.slots) {
    const slot = validateSlot(item);
    if (!slot.ok) return slot;
    if (seen.has(slot.value.id)) return fail(`duplicate slot id ${slot.value.id}`);
    seen.add(slot.value.id);
    slots.push(slot.value);
  }
  return { ok: true, value: slots };
}

function validateSlot(item: unknown): Validation<SlotInput> {
  if (!isRecord(item)) return fail("each slot must be an object");
  const { id, provider, start, end } = item;
  for (const [field, value] of Object.entries({ id, provider, start, end })) {
    if (typeof value !== "string" || value.trim() === "") {
      return fail(`slot ${field} must be a non-empty string`);
    }
  }
  const startMs = Date.parse(start as string);
  if (Number.isNaN(startMs)) return fail("slot start is not a valid date");
  if (Number.isNaN(Date.parse(end as string))) return fail("slot end is not a valid date");
  return {
    ok: true,
    value: {
      id: id as string,
      provider: provider as string,
      start: start as string,
      end: end as string,
      startMs,
    },
  };
}

export function parseLimit(raw: string | null): number | null {
  if (raw === null) return DEFAULT_LIMIT;
  if (!DIGITS_PATTERN.test(raw)) return null;
  const limit = Number(raw);
  return limit >= 1 && limit <= MAX_LIMIT ? limit : null;
}

export function encodeCursor(seq: number): string {
  return btoa(String(seq))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeCursor(raw: string): number | null {
  if (!BASE64URL_PATTERN.test(raw)) return null;
  const decoded = decodeBase64Url(raw);
  if (decoded === null || !DIGITS_PATTERN.test(decoded)) return null;
  const seq = Number(decoded);
  if (!Number.isSafeInteger(seq) || encodeCursor(seq) !== raw) return null;
  return seq;
}

function decodeBase64Url(raw: string): string | null {
  const padded = raw.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(raw.length / 4) * 4, "=");
  try {
    return atob(padded);
  } catch {
    return null;
  }
}

function trimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fail(error: string): { ok: false; error: string } {
  return { ok: false, error };
}
