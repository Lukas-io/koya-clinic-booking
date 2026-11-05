export const PAGE_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Book a clinic visit</title>
<style>
  :root {
    --bg: #f3f7f6;
    --surface: #ffffff;
    --ink: #1a2f2b;
    --muted: #55696a;
    --line: #d3e1dd;
    --accent: #1f7a6d;
    --accent-strong: #165f55;
    --accent-soft: #e3f1ee;
    --danger: #a4372b;
    --danger-soft: #fbeceb;
    --disabled-bg: #edf0ef;
    --disabled-ink: #6f7e7c;
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  .page { max-width: 720px; margin: 0 auto; padding: 24px 16px 64px; }
  header { margin-bottom: 24px; }
  h1 { font-size: 1.75rem; line-height: 1.2; margin: 0 0 8px; }
  h2 { font-size: 1.35rem; margin: 0 0 12px; }
  h2:focus { outline: none; }
  h3 { font-size: 1rem; margin: 24px 0 8px; color: var(--muted); font-weight: 600; }
  p { margin: 0 0 12px; }
  .lead { color: var(--muted); }
  .card {
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 20px;
  }
  .slot-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); }
  .slot {
    width: 100%;
    min-height: 56px;
    text-align: left;
    padding: 10px 14px;
    background: var(--surface);
    color: var(--ink);
    border: 1px solid var(--line);
    border-radius: 10px;
    font: inherit;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .slot:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); }
  .slot:disabled { background: var(--disabled-bg); color: var(--disabled-ink); cursor: not-allowed; }
  .slot-time { font-weight: 600; }
  .slot-provider, .slot-note { font-size: 0.875rem; }
  .slot-note { font-style: italic; }
  button:focus-visible, input:focus-visible { outline: 3px solid #7cc4b8; outline-offset: 2px; }
  .primary, .secondary, .danger {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 10px;
    font: inherit;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
  }
  .primary { background: var(--accent); color: #fff; }
  .primary:hover:not(:disabled) { background: var(--accent-strong); }
  .secondary { background: var(--surface); color: var(--accent-strong); border-color: var(--accent); }
  .danger { background: var(--surface); color: var(--danger); border-color: var(--danger); }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  .link {
    background: none;
    border: 0;
    padding: 8px 0;
    min-height: 44px;
    color: var(--accent-strong);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
    margin-bottom: 8px;
  }
  label { display: block; font-weight: 600; margin: 16px 0 6px; }
  input {
    width: 100%;
    min-height: 48px;
    padding: 0 12px;
    font: inherit;
    color: var(--ink);
    background: #fff;
    border: 1px solid #9db5b0;
    border-radius: 10px;
  }
  .summary { background: var(--accent-soft); border-radius: 10px; padding: 10px 14px; font-weight: 600; }
  .message { margin: 16px 0 0; padding: 10px 14px; border-radius: 10px; background: var(--accent-soft); }
  .message.error { background: var(--danger-soft); color: var(--danger); }
  .message:empty { display: none; }
  .actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 20px; }
  .form-actions { margin-top: 20px; }
  .form-actions .primary { width: 100%; }
  dl { margin: 0; }
  .row { display: grid; grid-template-columns: 110px 1fr; gap: 8px; padding: 10px 0; border-bottom: 1px solid var(--line); }
  .row:last-child { border-bottom: 0; }
  dt { color: var(--muted); }
  dd { margin: 0; font-weight: 600; overflow-wrap: anywhere; }
  .status-text { color: var(--muted); }
  @media (max-width: 480px) {
    .row { grid-template-columns: 1fr; gap: 2px; }
    .actions button { width: 100%; }
  }
</style>
</head>
<body>
<div class="page">
  <header>
    <h1>Book a clinic visit</h1>
    <p class="lead">Choose a time that suits you. Times are shown in your local time.</p>
  </header>
  <main>
    <section id="view-slots" aria-labelledby="slots-heading">
      <h2 id="slots-heading" tabindex="-1">Available times</h2>
      <p id="notice" class="message" role="status"></p>
      <p id="slots-status" class="status-text" role="status"></p>
      <button type="button" id="retry-slots" class="secondary" hidden>Try again</button>
      <div id="slots"></div>
    </section>

    <section id="view-form" class="card" aria-labelledby="form-heading" hidden>
      <button type="button" id="back-from-form" class="link">Back to times</button>
      <h2 id="form-heading" tabindex="-1">Your details</h2>
      <p id="chosen-slot" class="summary"></p>
      <form id="booking-form" novalidate>
        <label for="name">Full name</label>
        <input id="name" name="name" type="text" autocomplete="name" maxlength="200" required>
        <label for="email">Email address</label>
        <input id="email" name="email" type="email" autocomplete="email" maxlength="254" required>
        <p id="form-error" class="message error" role="alert"></p>
        <div class="form-actions">
          <button type="submit" id="submit" class="primary">Confirm booking</button>
        </div>
      </form>
    </section>

    <section id="view-confirmation" class="card" aria-labelledby="confirmation-heading" hidden>
      <h2 id="confirmation-heading" tabindex="-1">Booking confirmed</h2>
      <dl id="confirmation"></dl>
      <p id="confirmation-message" class="message" role="status"></p>
      <div class="actions">
        <button type="button" id="cancel-booking" class="danger">Cancel booking</button>
        <button type="button" id="back-from-confirmation" class="secondary">Back to times</button>
      </div>
    </section>
  </main>
</div>
<script>
(() => {
  "use strict";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const REQUEST_TIMEOUT_MS = 15000;
  const NETWORK_MESSAGE = "We could not reach the clinic. Check your connection and try again.";
  const SERVER_MESSAGE = "Something went wrong on our side. Please try again in a moment.";

  const state = { selected: null, booking: null, attempt: null };

  const byId = (id) => document.getElementById(id);
  const views = {
    slots: byId("view-slots"),
    form: byId("view-form"),
    confirmation: byId("view-confirmation"),
  };

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function showView(name) {
    for (const key of Object.keys(views)) views[key].hidden = key !== name;
    views[name].querySelector("h2").focus();
    window.scrollTo(0, 0);
  }

  function setText(id, text) {
    byId(id).textContent = text;
  }

  function formatDay(iso) {
    return new Date(iso).toLocaleDateString(undefined, {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function formatDateTime(iso) {
    return new Date(iso).toLocaleString(undefined, {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
      hour: "numeric", minute: "2-digit", timeZoneName: "short",
    });
  }

  function waitText(seconds) {
    if (!seconds) return "a little while";
    return seconds === 1 ? "1 second" : seconds + " seconds";
  }

  async function request(method, path, options) {
    const settings = options || {};
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(path, {
        method,
        headers: settings.headers,
        body: settings.body,
        signal: controller.signal,
      });
      const body = await response.json().catch(() => ({}));
      return {
        reached: true,
        status: response.status,
        body,
        retryAfter: Number(response.headers.get("Retry-After")) || 0,
      };
    } catch (error) {
      return { reached: false, status: 0, body: {}, retryAfter: 0 };
    } finally {
      clearTimeout(timer);
    }
  }

  function hasStarted(slot) {
    return Date.parse(slot.start) <= Date.now();
  }

  function dayKey(date) {
    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate();
  }

  function groupByDay(slots) {
    const groups = [];
    const index = new Map();
    for (const slot of slots) {
      const key = dayKey(new Date(slot.start));
      if (!index.has(key)) {
        const group = { start: slot.start, slots: [] };
        index.set(key, group);
        groups.push(group);
      }
      index.get(key).slots.push(slot);
    }
    return groups;
  }

  function slotButton(slot) {
    const unavailable = !slot.available;
    const started = hasStarted(slot);
    const button = make("button", "slot");
    button.type = "button";
    button.disabled = unavailable || started;
    button.append(
      make("span", "slot-time", formatTime(slot.start)),
      make("span", "slot-provider", slot.provider)
    );
    if (unavailable) button.append(make("span", "slot-note", "Already booked"));
    else if (started) button.append(make("span", "slot-note", "Already started"));
    button.addEventListener("click", () => selectSlot(slot));
    return button;
  }

  function dayGroup(group) {
    const wrapper = make("section");
    wrapper.append(make("h3", null, formatDay(group.start)));
    const list = make("ul", "slot-list");
    for (const slot of group.slots) {
      const item = make("li");
      item.append(slotButton(slot));
      list.append(item);
    }
    wrapper.append(list);
    return wrapper;
  }

  function renderSlots(slots) {
    const container = byId("slots");
    container.replaceChildren();
    if (slots.length === 0) {
      setText("slots-status", "No appointment times are available right now. Please check back soon.");
      return;
    }
    const open = slots.filter((slot) => slot.available && !hasStarted(slot));
    setText("slots-status", open.length === 0 ? "Every time is currently taken or has started. Please check back soon." : "");
    for (const group of groupByDay(slots)) container.append(dayGroup(group));
  }

  async function loadSlots() {
    byId("retry-slots").hidden = true;
    setText("slots-status", "Loading available times...");
    byId("slots").replaceChildren();
    const result = await request("GET", "/web/slots");
    if (!result.reached || result.status !== 200 || !Array.isArray(result.body.slots)) {
      setText("slots-status", "We could not load the available times.");
      byId("retry-slots").hidden = false;
      return;
    }
    renderSlots(result.body.slots);
  }

  function setNotice(text) {
    setText("notice", text);
  }

  function goToSlots(notice) {
    setNotice(notice || "");
    showView("slots");
    loadSlots();
  }

  function selectSlot(slot) {
    state.selected = slot;
    state.attempt = null;
    setText("chosen-slot", slot.provider + " · " + formatDateTime(slot.start));
    setText("form-error", "");
    setNotice("");
    showView("form");
    byId("name").focus();
  }

  function showFormError(text) {
    setText("form-error", text);
  }

  function findFormProblem(name, email) {
    if (!name) return "Enter your full name.";
    if (!email) return "Enter your email address.";
    if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address, for example name@example.com.";
    return "";
  }

  function attemptFor(name, email) {
    const fingerprint = JSON.stringify([state.selected.id, name, email]);
    if (!state.attempt || state.attempt.fingerprint !== fingerprint) {
      state.attempt = { fingerprint, key: crypto.randomUUID() };
    }
    return state.attempt;
  }

  function setSubmitting(submitting) {
    const button = byId("submit");
    button.disabled = submitting;
    button.textContent = submitting ? "Booking..." : "Confirm booking";
  }

  function handleBadRequest(body) {
    const detail = typeof body.error === "string" ? body.error : "";
    if (detail.includes("started")) {
      goToSlots("That time has already started. Please choose another.");
      return;
    }
    showFormError("Please check your details and try again. " + detail);
  }

  function handleBookingResult(result) {
    if (!result.reached) {
      showFormError(NETWORK_MESSAGE + " Your details are kept.");
      return;
    }
    state.attempt = null;
    if (result.status === 201) return showConfirmation(result.body);
    if (result.status === 409) return goToSlots("Sorry, that time was just taken. Please choose another.");
    if (result.status === 404) return goToSlots("That time is no longer available. Please choose another.");
    if (result.status === 400) return handleBadRequest(result.body);
    if (result.status === 422) return showFormError("That request clashed with an earlier attempt. Please try again.");
    if (result.status === 429) {
      return showFormError("Too many booking attempts. Please wait " + waitText(result.retryAfter) + " and try again.");
    }
    showFormError(SERVER_MESSAGE);
  }

  async function onSubmit(event) {
    event.preventDefault();
    const name = byId("name").value.trim();
    const email = byId("email").value.trim().toLowerCase();
    const problem = findFormProblem(name, email);
    setText("form-error", problem);
    if (problem) return;
    setSubmitting(true);
    const attempt = attemptFor(name, email);
    const result = await request("POST", "/web/bookings", {
      headers: { "Content-Type": "application/json", "Idempotency-Key": attempt.key },
      body: JSON.stringify({ slot_id: state.selected.id, name, email }),
    });
    setSubmitting(false);
    handleBookingResult(result);
  }

  function renderConfirmation() {
    const booking = state.booking.data;
    const slot = state.booking.slot;
    const rows = [
      ["Booking id", booking.id],
      ["Provider", slot.provider],
      ["Time", formatDateTime(slot.start)],
      ["Name", booking.name],
      ["Email", booking.email],
      ["Status", booking.status],
    ];
    const list = byId("confirmation");
    list.replaceChildren();
    for (const [label, value] of rows) {
      const row = make("div", "row");
      row.append(make("dt", null, label), make("dd", null, value));
      list.append(row);
    }
    byId("cancel-booking").hidden = booking.status !== "confirmed";
    setText("confirmation-heading", booking.status === "confirmed" ? "Booking confirmed" : "Booking cancelled");
  }

  function showConfirmation(booking) {
    state.booking = { data: booking, slot: state.selected };
    setText("confirmation-message", "");
    renderConfirmation();
    showView("confirmation");
    loadSlots();
  }

  function markCancelled(message) {
    state.booking.data.status = "cancelled";
    renderConfirmation();
    setText("confirmation-message", message);
    loadSlots();
  }

  function handleCancelResult(result) {
    if (!result.reached) return setText("confirmation-message", NETWORK_MESSAGE);
    if (result.status === 200) return markCancelled("Your booking has been cancelled and the time is free for others.");
    if (result.status === 409) return markCancelled("This booking was already cancelled.");
    if (result.status === 404) return setText("confirmation-message", "We could not find this booking. It may have been removed.");
    setText("confirmation-message", SERVER_MESSAGE);
  }

  async function onCancel() {
    const button = byId("cancel-booking");
    button.disabled = true;
    setText("confirmation-message", "Cancelling your booking...");
    const result = await request("DELETE", "/web/bookings/" + encodeURIComponent(state.booking.data.id));
    button.disabled = false;
    handleCancelResult(result);
  }

  byId("booking-form").addEventListener("submit", onSubmit);
  byId("cancel-booking").addEventListener("click", onCancel);
  byId("retry-slots").addEventListener("click", loadSlots);
  byId("back-from-form").addEventListener("click", () => goToSlots(""));
  byId("back-from-confirmation").addEventListener("click", () => goToSlots(""));

  loadSlots();
})();
</script>
</body>
</html>
`;
