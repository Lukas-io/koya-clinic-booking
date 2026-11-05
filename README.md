# Koya clinic booking

A clinic booking API and a small booking web page, served from one Cloudflare Worker. All state lives in a single SQLite-backed Durable Object (`Clinic`), reached through RPC. There is no framework and no build step.

- `src/index.ts`: Worker. Authenticates, reads the body, routes, and calls the Durable Object.
- `src/clinic.ts`: the `Clinic` Durable Object. Schema, booking rules, rate limits, idempotency.
- `src/validation.ts`: request parsing and validation helpers.
- `src/page.ts`: the web page (HTML, CSS and JS in one string).
- `seed/slots.json`: sample slots for two providers.

## How each level is met

1. **Slots and bookings.** `POST /reset`, `GET /slots`, `POST /bookings`, `GET /bookings/{id}`. `start` and `end` are stored and returned exactly as sent, and slots are sorted by a parsed `start_ms` column.
2. **Auth and validation.** Every API route checks `X-API-Key` first (including unknown paths) with a constant-time comparison of SHA-256 digests. Bookings are validated, trimmed and lower-cased before the slot lookup and the started-slot check.
3. **No double booking.** The rule is enforced by the database, not by application code: the partial unique index `one_confirmed_booking_per_slot ON bookings(slot_id) WHERE status = 'confirmed'`. The insert uses `ON CONFLICT (slot_id) WHERE status = 'confirmed' DO NOTHING RETURNING ...`, and no returned row means 409. On top of that, a Durable Object is single-threaded, and every mutating method runs inside `transactionSync` with no `await`, so each request is atomic and requests cannot interleave. Cancelling sets `status = 'cancelled'`, which drops the booking out of the index and frees the slot.
4. **Idempotency and listing.** With an `Idempotency-Key`, the stored status and body are replayed verbatim for the same canonical body (JSON with sorted keys), and a different body gets 422. Stored responses cover 400, 404, 409 and 201 and are written in the same transaction as the booking. `GET /bookings` uses opaque base64url cursors over an autoincrement `seq` and fetches `limit + 1` rows, so `next_cursor` is `null` on the last page and never points at an empty page.
5. **Rate limiting.** Five attempts per email per rolling 60 seconds, counted in the `rate_limit_attempts` table, including attempts that fail validation. The 6th gets 429 with `Retry-After`. 429s are not recorded and not stored under the idempotency key, and replays and 422s do not consume attempts. Errors are returned as values (never thrown), so recorded attempts commit with the transaction.

## The web page and the API key

`GET /` serves the page without a key. The API key must never reach the browser, so the page does not use the API routes. It calls a small set of public same-origin routes that call the same Durable Object methods:

- `GET /web/slots`
- `POST /web/bookings` (also limited to 10 attempts per minute per `CF-Connecting-IP`, stored with subject `ip:<address>`)
- `DELETE /web/bookings/{id}`

There is deliberately no public route for `/reset` or for listing bookings by email, since those would give anyone destructive access or other people's personal data. The IP limit applies only to the web route, so the API route is free of it. The page renders all data with `textContent`, and a Content-Security-Policy restricts it to its own origin.

## Run locally

```sh
npm install
npm run dev
```

The local key comes from `.dev.vars` (`API_KEY=local-dev-key`). Seed and check:

```sh
curl -X POST http://localhost:8787/reset \
  -H "X-API-Key: local-dev-key" -H "Content-Type: application/json" \
  --data @seed/slots.json
curl -H "X-API-Key: local-dev-key" http://localhost:8787/slots
```

Open http://localhost:8787 for the booking page. `npm run typecheck` runs the TypeScript check.

## Deploy

```sh
npx wrangler login
npx wrangler secret put API_KEY
npm run deploy
curl -X POST https://koya-clinic-booking.<your-subdomain>.workers.dev/reset \
  -H "X-API-Key: <your key>" -H "Content-Type: application/json" \
  --data @seed/slots.json
```

The seed slots are in January 2027. Replace them with future dates if you are reading this after that.
