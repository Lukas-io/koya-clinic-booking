import { DurableObject } from "cloudflare:workers";
import { Result, errorResult, jsonResult } from "./result";
import {
  BookingInput,
  MAX_BODY_BYTES,
  MAX_KEY_LENGTH,
  SlotInput,
  byteLength,
  canonicalise,
  decodeCursor,
  encodeCursor,
  normaliseEmail,
  parseJson,
  parseLimit,
  rateLimitEmail,
  validateBooking,
  validateReset,
  ParsedJson,
} from "./validation";

const RATE_WINDOW_MS = 60_000;
const EMAIL_ATTEMPT_LIMIT = 5;
const IP_ATTEMPT_LIMIT = 10;

type BookingRow = {
  id: string;
  slot_id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
};

type PagedBookingRow = BookingRow & { seq: number };

type SlotRow = { id: string; start_ms: number };

type SlotListRow = {
  id: string;
  provider: string;
  start: string;
  end: string;
  available: number;
};

type IdempotencyRow = { request_body: string; status: number; response: string };

export class Clinic extends DurableObject {
  private readonly sql: SqlStorage;

  constructor(ctx: DurableObjectState, env: Cloudflare.Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    createSchema(this.sql);
  }

  reset(rawBody: string): Result {
    const slots = validateReset(rawBody);
    if (!slots.ok) return errorResult(400, slots.error);
    this.ctx.storage.transactionSync(() => replaceAllSlots(this.sql, slots.value));
    return jsonResult(200, { slots: slots.value.length });
  }

  listSlots(provider: string | null): Result {
    return jsonResult(200, { slots: selectSlots(this.sql, provider) });
  }

  createBooking(rawBody: string, idempotencyKey: string | null): Result {
    return this.ctx.storage.transactionSync(() =>
      placeBooking(this.sql, rawBody, idempotencyKey, Date.now()),
    );
  }

  consumeIpAttempt(subject: string): Result | null {
    return this.ctx.storage.transactionSync(() =>
      consumeAttempt(this.sql, subject, IP_ATTEMPT_LIMIT, Date.now()),
    );
  }

  listBookings(email: string | null, limit: string | null, cursor: string | null): Result {
    return pageBookings(this.sql, email, limit, cursor);
  }

  getBooking(id: string): Result {
    const booking = selectBooking(this.sql, id);
    return booking ? jsonResult(200, booking) : errorResult(404, "booking not found");
  }

  cancelBooking(id: string): Result {
    return this.ctx.storage.transactionSync(() => cancelConfirmedBooking(this.sql, id));
  }
}

function createSchema(sql: SqlStorage): void {
  sql.exec(`CREATE TABLE IF NOT EXISTS slots (
    id TEXT PRIMARY KEY,
    provider TEXT NOT NULL,
    start TEXT NOT NULL,
    "end" TEXT NOT NULL,
    start_ms INTEGER NOT NULL
  )`);
  sql.exec(`CREATE TABLE IF NOT EXISTS bookings (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    id TEXT UNIQUE NOT NULL,
    slot_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
  sql.exec(`CREATE UNIQUE INDEX IF NOT EXISTS one_confirmed_booking_per_slot
    ON bookings(slot_id) WHERE status = 'confirmed'`);
  sql.exec(`CREATE INDEX IF NOT EXISTS bookings_by_email ON bookings(email, seq)`);
  sql.exec(`CREATE TABLE IF NOT EXISTS idempotency_keys (
    key TEXT PRIMARY KEY,
    request_body TEXT NOT NULL,
    status INTEGER NOT NULL,
    response TEXT NOT NULL
  )`);
  sql.exec(`CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    subject TEXT NOT NULL,
    at_ms INTEGER NOT NULL
  )`);
  sql.exec(`CREATE INDEX IF NOT EXISTS rate_limit_by_subject
    ON rate_limit_attempts(subject, at_ms)`);
}

function replaceAllSlots(sql: SqlStorage, slots: SlotInput[]): void {
  sql.exec("DELETE FROM bookings");
  sql.exec("DELETE FROM slots");
  sql.exec("DELETE FROM idempotency_keys");
  sql.exec("DELETE FROM rate_limit_attempts");
  for (const slot of slots) insertSlot(sql, slot);
}

function insertSlot(sql: SqlStorage, slot: SlotInput): void {
  sql.exec(
    'INSERT INTO slots (id, provider, start, "end", start_ms) VALUES (?, ?, ?, ?, ?)',
    slot.id,
    slot.provider,
    slot.start,
    slot.end,
    slot.startMs,
  );
}

function selectSlots(sql: SqlStorage, provider: string | null) {
  const rows = sql
    .exec<SlotListRow>(
      `SELECT s.id, s.provider, s.start, s."end" AS "end",
        NOT EXISTS (
          SELECT 1 FROM bookings b WHERE b.slot_id = s.id AND b.status = 'confirmed'
        ) AS available
      FROM slots s
      WHERE (?1 IS NULL OR s.provider = ?1)
      ORDER BY s.start_ms, s.id`,
      provider,
    )
    .toArray();
  return rows.map((row) => ({ ...row, available: row.available === 1 }));
}

function placeBooking(
  sql: SqlStorage,
  rawBody: string,
  idempotencyKey: string | null,
  now: number,
): Result {
  if (byteLength(rawBody) > MAX_BODY_BYTES) {
    return errorResult(400, "request body is too large");
  }
  if (idempotencyKey !== null && idempotencyKey.length > MAX_KEY_LENGTH) {
    return errorResult(400, "Idempotency-Key is too long");
  }
  const canonical = canonicalise(rawBody);
  if (idempotencyKey) {
    const replay = replayStoredResponse(sql, idempotencyKey, canonical);
    if (replay) return replay;
  }
  const parsed = parseJson(rawBody);
  const limited = limitByEmail(sql, parsed, now);
  if (limited) return limited;
  const result = attemptBooking(sql, parsed, now);
  if (idempotencyKey) storeResponse(sql, idempotencyKey, canonical, result);
  return result;
}

function replayStoredResponse(
  sql: SqlStorage,
  key: string,
  canonicalBody: string,
): Result | null {
  const stored = sql
    .exec<IdempotencyRow>(
      "SELECT request_body, status, response FROM idempotency_keys WHERE key = ?",
      key,
    )
    .toArray()[0];
  if (!stored) return null;
  if (stored.request_body !== canonicalBody) {
    return errorResult(422, "Idempotency-Key was already used with a different request body");
  }
  return { status: stored.status, body: stored.response };
}

function storeResponse(
  sql: SqlStorage,
  key: string,
  canonicalBody: string,
  result: Result,
): void {
  sql.exec(
    "INSERT INTO idempotency_keys (key, request_body, status, response) VALUES (?, ?, ?, ?)",
    key,
    canonicalBody,
    result.status,
    result.body,
  );
}

function limitByEmail(sql: SqlStorage, parsed: ParsedJson, now: number): Result | null {
  const email = rateLimitEmail(parsed);
  if (email === null) return null;
  return consumeAttempt(sql, `email:${email}`, EMAIL_ATTEMPT_LIMIT, now);
}

function consumeAttempt(
  sql: SqlStorage,
  subject: string,
  limit: number,
  now: number,
): Result | null {
  sql.exec(
    "DELETE FROM rate_limit_attempts WHERE subject = ? AND at_ms <= ?",
    subject,
    now - RATE_WINDOW_MS,
  );
  const { count, oldest } = sql
    .exec<{ count: number; oldest: number | null }>(
      "SELECT COUNT(*) AS count, MIN(at_ms) AS oldest FROM rate_limit_attempts WHERE subject = ?",
      subject,
    )
    .one();
  if (count >= limit) return tooManyAttempts(oldest ?? now, now);
  sql.exec("INSERT INTO rate_limit_attempts (subject, at_ms) VALUES (?, ?)", subject, now);
  return null;
}

function tooManyAttempts(oldest: number, now: number): Result {
  const seconds = Math.max(1, Math.ceil((oldest + RATE_WINDOW_MS - now) / 1000));
  return errorResult(429, "too many booking attempts, try again later", {
    "Retry-After": String(seconds),
  });
}

function attemptBooking(sql: SqlStorage, parsed: ParsedJson, now: number): Result {
  const input = validateBooking(parsed);
  if (!input.ok) return errorResult(400, input.error);
  const slot = selectSlot(sql, input.value.slotId);
  if (!slot) return errorResult(404, "slot not found");
  if (slot.start_ms <= now) return errorResult(400, "slot has already started");
  const booking = insertConfirmedBooking(sql, input.value, now);
  if (!booking) return errorResult(409, "slot is already booked");
  return jsonResult(201, booking);
}

function selectSlot(sql: SqlStorage, id: string): SlotRow | undefined {
  return sql.exec<SlotRow>("SELECT id, start_ms FROM slots WHERE id = ?", id).toArray()[0];
}

function insertConfirmedBooking(
  sql: SqlStorage,
  input: BookingInput,
  now: number,
): BookingRow | undefined {
  return sql
    .exec<BookingRow>(
      `INSERT INTO bookings (id, slot_id, name, email, status, created_at)
      VALUES (?, ?, ?, ?, 'confirmed', ?)
      ON CONFLICT (slot_id) WHERE status = 'confirmed' DO NOTHING
      RETURNING id, slot_id, name, email, status, created_at`,
      crypto.randomUUID(),
      input.slotId,
      input.name,
      input.email,
      new Date(now).toISOString(),
    )
    .toArray()[0];
}

function pageBookings(
  sql: SqlStorage,
  email: string | null,
  rawLimit: string | null,
  rawCursor: string | null,
): Result {
  if (email === null || normaliseEmail(email) === "") {
    return errorResult(400, "email is required");
  }
  const limit = parseLimit(rawLimit);
  if (limit === null) return errorResult(400, "limit must be a whole number from 1 to 50");
  const after = rawCursor === null ? 0 : decodeCursor(rawCursor);
  if (after === null) return errorResult(400, "cursor is not valid");
  const rows = sql
    .exec<PagedBookingRow>(
      `SELECT seq, id, slot_id, name, email, status, created_at
      FROM bookings WHERE email = ? AND seq > ? ORDER BY seq LIMIT ?`,
      normaliseEmail(email),
      after,
      limit + 1,
    )
    .toArray();
  const page = rows.slice(0, limit);
  const nextCursor = rows.length > limit ? encodeCursor(page[page.length - 1].seq) : null;
  return jsonResult(200, {
    bookings: page.map(withoutSeq),
    next_cursor: nextCursor,
  });
}

function withoutSeq(row: PagedBookingRow): BookingRow {
  const { seq: _seq, ...booking } = row;
  return booking;
}

function selectBooking(sql: SqlStorage, id: string): BookingRow | undefined {
  return sql
    .exec<BookingRow>(
      "SELECT id, slot_id, name, email, status, created_at FROM bookings WHERE id = ?",
      id,
    )
    .toArray()[0];
}

function cancelConfirmedBooking(sql: SqlStorage, id: string): Result {
  const booking = selectBooking(sql, id);
  if (!booking) return errorResult(404, "booking not found");
  if (booking.status === "cancelled") return errorResult(409, "booking is already cancelled");
  sql.exec("UPDATE bookings SET status = 'cancelled' WHERE id = ?", id);
  return jsonResult(200, { ...booking, status: "cancelled" });
}
