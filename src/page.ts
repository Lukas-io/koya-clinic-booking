export const PAGE_HTML = String.raw`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Book a clinic visit</title>
<style>
  :root {
    --bg: #f5f7f7;
    --surface: #ffffff;
    --ink: #14292a;
    --muted: #5a6e6f;
    --line: #e1e8e7;
    --line-strong: #c9d6d4;
    --accent: #0f766e;
    --accent-strong: #115e59;
    --accent-soft: #e8f4f2;
    --danger: #b42318;
    --danger-soft: #fdf0ee;
    --disabled-bg: #f6f8f8;
    --disabled-ink: #6b7c7d;
    --ring: rgba(15, 118, 110, 0.35);
  }
  * { box-sizing: border-box; }
  [hidden] { display: none !important; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--ink);
    font: 16px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  h1, h2, h3, p { margin: 0; }
  h2 { font-size: 1.375rem; line-height: 1.3; font-weight: 700; letter-spacing: -0.01em; }
  h2:focus { outline: none; }
  button { font: inherit; }
  button:focus-visible, input:focus-visible {
    outline: 3px solid var(--ring);
    outline-offset: 2px;
  }
  .page { padding: 48px 16px 64px; }
  .shell {
    max-width: 900px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: 280px 1fr;
    background: var(--surface);
    border: 1px solid var(--line);
    border-radius: 12px;
    box-shadow: 0 1px 2px rgba(20, 41, 42, 0.04), 0 8px 24px rgba(20, 41, 42, 0.06);
    overflow: hidden;
  }
  .context { padding: 32px; border-right: 1px solid var(--line); }
  .brand { font-size: 0.875rem; font-weight: 600; color: var(--accent); margin-bottom: 8px; }
  .context h1 { font-size: 1.5rem; line-height: 1.25; font-weight: 700; letter-spacing: -0.01em; margin-bottom: 16px; }
  .fact { display: flex; align-items: flex-start; gap: 8px; color: var(--muted); font-size: 0.9375rem; margin-bottom: 8px; }
  .fact svg { flex: none; margin-top: 3px; }
  .context .about { color: var(--muted); font-size: 0.9375rem; margin-top: 16px; }
  .panel { padding: 32px; min-height: 480px; min-width: 0; }
  .lead { color: var(--muted); margin-top: 4px; }
  .message { margin-top: 16px; padding: 12px 16px; border-radius: 10px; background: var(--accent-soft); color: var(--accent-strong); font-size: 0.9375rem; }
  .message.error { background: var(--danger-soft); color: var(--danger); }
  .message:empty { display: none; }
  .status-text { color: var(--muted); margin-top: 16px; }
  .status-text:empty { display: none; }
  .days {
    display: flex;
    gap: 8px;
    margin-top: 24px;
    padding: 2px 2px 8px;
    overflow-x: auto;
    scrollbar-width: thin;
  }
  .day {
    flex: none;
    width: 68px;
    padding: 8px 0 10px;
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.25;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .day:hover { border-color: var(--accent); background: var(--accent-soft); }
  .day-weekday, .day-month { font-size: 0.8125rem; }
  .day-number { font-size: 1.25rem; font-weight: 700; }
  .day.muted { color: var(--disabled-ink); background: var(--disabled-bg); border-color: var(--line); }
  .day.muted:hover { border-color: var(--line-strong); background: #eef2f2; }
  .day[aria-pressed="true"] { background: var(--accent); border-color: var(--accent); color: #fff; }
  .day[aria-pressed="true"]:hover { background: var(--accent-strong); border-color: var(--accent-strong); }
  .day-label { font-size: 1rem; font-weight: 600; margin: 24px 0 12px; }
  #slots { display: grid; gap: 8px; }
  .slot {
    width: 100%;
    min-height: 56px;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    gap: 8px 16px;
    flex-wrap: wrap;
    text-align: left;
    color: var(--ink);
    background: var(--surface);
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.12s, border-color 0.12s;
  }
  .slot:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); }
  .slot-time { font-weight: 600; flex: 1 1 auto; }
  .slot-provider { color: var(--muted); font-size: 0.9375rem; }
  .slot-tag {
    font-size: 0.75rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 999px;
    background: #e8eded;
    color: var(--disabled-ink);
  }
  .slot:disabled { background: var(--disabled-bg); border-color: var(--line); cursor: not-allowed; }
  .slot:disabled .slot-time, .slot:disabled .slot-provider { color: var(--disabled-ink); font-weight: 500; }
  .primary, .secondary, .danger {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 10px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid transparent;
    transition: background 0.12s, border-color 0.12s;
  }
  .primary { background: var(--accent); color: #fff; }
  .primary:hover:not(:disabled) { background: var(--accent-strong); }
  .secondary { background: var(--surface); color: var(--accent-strong); border-color: var(--line-strong); }
  .secondary:hover:not(:disabled) { border-color: var(--accent); background: var(--accent-soft); }
  .danger { background: transparent; color: var(--danger); }
  .danger:hover:not(:disabled) { background: var(--danger-soft); }
  button:disabled { opacity: 0.6; cursor: not-allowed; }
  #retry-slots { margin-top: 16px; }
  .back {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-height: 40px;
    margin: -8px 0 16px -8px;
    padding: 0 8px;
    color: var(--muted);
    background: none;
    border: 0;
    border-radius: 8px;
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
  }
  .back:hover { color: var(--accent-strong); background: var(--accent-soft); }
  .summary { margin: 16px 0 8px; padding: 16px; border: 1px solid var(--line); border-radius: 10px; background: var(--disabled-bg); }
  .summary-provider { font-weight: 600; }
  .summary-line { color: var(--muted); font-size: 0.9375rem; }
  label { display: block; font-weight: 600; font-size: 0.9375rem; margin: 20px 0 6px; }
  input {
    width: 100%;
    min-height: 48px;
    padding: 0 14px;
    font: inherit;
    color: var(--ink);
    background: #fff;
    border: 1px solid var(--line-strong);
    border-radius: 10px;
    transition: border-color 0.12s, box-shadow 0.12s;
  }
  input:hover { border-color: var(--muted); }
  input:focus-visible { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px var(--ring); }
  .form-actions { margin-top: 24px; }
  .form-actions .primary { width: 100%; }
  .mark {
    width: 48px;
    height: 48px;
    margin-bottom: 16px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    color: var(--accent);
    background: var(--accent-soft);
  }
  .mark.cancelled { color: var(--muted); background: #eef2f2; }
  .details-title { font-size: 0.9375rem; font-weight: 600; color: var(--muted); margin: 24px 0 4px; }
  dl { margin: 0; }
  .row { display: grid; grid-template-columns: 160px 1fr; gap: 8px; padding: 12px 0; border-bottom: 1px solid var(--line); }
  .row:last-child { border-bottom: 0; }
  dt { color: var(--muted); font-size: 0.9375rem; }
  dd { margin: 0; font-weight: 500; overflow-wrap: anywhere; }
  .actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-top: 24px; }
  .actions .secondary { order: 2; }
  @media (max-width: 720px) {
    .page { padding: 16px 12px 40px; }
    .shell { grid-template-columns: 1fr; }
    .context { padding: 20px; border-right: 0; border-bottom: 1px solid var(--line); }
    .context h1 { margin-bottom: 8px; font-size: 1.25rem; }
    .context .about { display: none; }
    .panel { padding: 20px; min-height: 0; }
  }
  @media (max-width: 480px) {
    .row { grid-template-columns: 1fr; gap: 2px; padding: 10px 0; }
    .actions { flex-direction: column-reverse; align-items: stretch; }
    .actions .secondary { order: 0; }
    .actions button { width: 100%; }
  }
</style>
</head>
<body>
<div class="page">
  <main class="shell">
    <aside class="context">
      <p class="brand">Koya clinic</p>
      <h1>Book a clinic visit</h1>
      <p class="fact">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>
        <span>30 min appointment</span>
      </p>
      <p class="fact">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18"></path><path d="M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3z"></path></svg>
        <span id="timezone"></span>
      </p>
      <p class="about">Choose a time that suits you, add your details and your appointment is booked.</p>
    </aside>

    <div class="panel">
      <section id="view-slots" aria-labelledby="slots-heading">
        <h2 id="slots-heading" tabindex="-1">Select a time</h2>
        <p class="lead">Pick a day, then choose an available time.</p>
        <p id="notice" class="message" role="status"></p>
        <p id="slots-status" class="status-text" role="status"></p>
        <button type="button" id="retry-slots" class="secondary" hidden>Try again</button>
        <div id="days" class="days"></div>
        <h3 id="day-label" class="day-label" hidden></h3>
        <div id="slots"></div>
      </section>

      <section id="view-form" aria-labelledby="form-heading" hidden>
        <button type="button" id="back-from-form" class="back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"></path></svg>
          Back to times
        </button>
        <h2 id="form-heading" tabindex="-1">Your details</h2>
        <div id="chosen-slot" class="summary"></div>
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

      <section id="view-confirmation" aria-labelledby="confirmation-heading" hidden>
        <div id="confirmation-mark" class="mark" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path id="mark-path" d="M5 12.5l4.5 4.5L19 7.5"></path></svg>
        </div>
        <h2 id="confirmation-heading" tabindex="-1">You're all set</h2>
        <p id="confirmation-lead" class="lead"></p>
        <p class="details-title">Appointment details</p>
        <dl id="confirmation"></dl>
        <p id="confirmation-message" class="message" role="status"></p>
        <div class="actions">
          <button type="button" id="cancel-booking" class="danger">Cancel booking</button>
          <button type="button" id="back-from-confirmation" class="secondary">Book another time</button>
        </div>
      </section>
    </div>
  </main>
</div>
<script>
(() => {
  "use strict";

  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const REQUEST_TIMEOUT_MS = 15000;
  const NETWORK_MESSAGE = "We could not reach the clinic. Check your connection and try again.";
  const SERVER_MESSAGE = "Something went wrong on our side. Please try again in a moment.";
  const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone || "your local time";
  const CHECK_PATH = "M5 12.5l4.5 4.5L19 7.5";
  const CROSS_PATH = "M6 6l12 12M18 6L6 18";

  const state = { selected: null, booking: null, attempt: null, slots: [], dayKey: null };

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

  function formatDayLabel(iso) {
    return new Date(iso).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" });
  }

  function formatTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  function formatTimeRange(slot) {
    const start = formatTime(slot.start);
    const end = formatTime(slot.end);
    const suffix = end.replace(/^[\d:.\s]+/, "");
    const sharesSuffix = suffix !== "" && start.endsWith(suffix);
    return (sharesSuffix ? start.slice(0, -suffix.length).trim() : start) + " to " + end;
  }

  function waitText(seconds) {
    if (!seconds) return "a little while";
    return seconds === 1 ? "1 second" : seconds + " seconds";
  }

  function capitalise(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
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

  function isBookable(slot) {
    return slot.available && !hasStarted(slot);
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
        const group = { key, start: slot.start, slots: [] };
        index.set(key, group);
        groups.push(group);
      }
      index.get(key).slots.push(slot);
    }
    return groups;
  }

  function slotTag(slot) {
    if (!slot.available) return "Booked";
    if (hasStarted(slot)) return "Passed";
    return "";
  }

  function slotButton(slot) {
    const tag = slotTag(slot);
    const button = make("button", "slot");
    button.type = "button";
    button.disabled = tag !== "";
    button.append(
      make("span", "slot-time", formatTimeRange(slot)),
      make("span", "slot-provider", slot.provider)
    );
    if (tag) button.append(make("span", "slot-tag", tag));
    button.addEventListener("click", () => selectSlot(slot));
    return button;
  }

  function dayChip(group, selected) {
    const date = new Date(group.start);
    const chip = make("button", "day");
    chip.type = "button";
    chip.setAttribute("aria-pressed", String(selected));
    chip.setAttribute("aria-label", formatDayLabel(group.start));
    if (!group.slots.some(isBookable)) chip.classList.add("muted");
    chip.append(
      make("span", "day-weekday", date.toLocaleDateString(undefined, { weekday: "short" })),
      make("span", "day-month", date.toLocaleDateString(undefined, { month: "short" })),
      make("span", "day-number", String(date.getDate()))
    );
    chip.addEventListener("click", () => chooseDay(group.key));
    return chip;
  }

  function pickDefaultDay(groups) {
    if (groups.some((group) => group.key === state.dayKey)) return state.dayKey;
    const firstOpen = groups.find((group) => group.slots.some(isBookable));
    return (firstOpen || groups[0]).key;
  }

  function renderDays(groups) {
    const strip = byId("days");
    strip.replaceChildren(...groups.map((group) => dayChip(group, group.key === state.dayKey)));
  }

  function renderTimes(groups) {
    const group = groups.find((item) => item.key === state.dayKey);
    const label = byId("day-label");
    label.hidden = !group;
    label.textContent = group ? formatDayLabel(group.start) : "";
    byId("slots").replaceChildren(...(group ? group.slots.map(slotButton) : []));
  }

  function chooseDay(key) {
    state.dayKey = key;
    const groups = groupByDay(state.slots);
    renderDays(groups);
    renderTimes(groups);
    byId("days").querySelector('[aria-pressed="true"]').focus();
  }

  function clearSlots() {
    byId("days").replaceChildren();
    byId("slots").replaceChildren();
    byId("day-label").hidden = true;
  }

  function renderSlots(slots) {
    state.slots = slots;
    clearSlots();
    if (slots.length === 0) {
      setText("slots-status", "No appointment times are available right now. Please check back soon.");
      return;
    }
    const open = slots.filter(isBookable);
    setText("slots-status", open.length === 0 ? "Every time is currently taken or has started. Please check back soon." : "");
    const groups = groupByDay(slots);
    state.dayKey = pickDefaultDay(groups);
    renderDays(groups);
    renderTimes(groups);
  }

  async function loadSlots() {
    byId("retry-slots").hidden = true;
    setText("slots-status", "Loading available times...");
    clearSlots();
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

  function renderChosenSlot(slot) {
    byId("chosen-slot").replaceChildren(
      make("p", "summary-provider", slot.provider),
      make("p", "summary-line", formatDay(slot.start)),
      make("p", "summary-line", formatTimeRange(slot) + " (" + TIMEZONE + ")")
    );
  }

  function selectSlot(slot) {
    state.selected = slot;
    state.attempt = null;
    renderChosenSlot(slot);
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

  function renderConfirmationHeader(confirmed) {
    setText("confirmation-heading", confirmed ? "You're all set" : "Booking cancelled");
    setText("confirmation-lead", confirmed ? "Your appointment is booked." : "This appointment is cancelled.");
    byId("confirmation-mark").classList.toggle("cancelled", !confirmed);
    byId("mark-path").setAttribute("d", confirmed ? CHECK_PATH : CROSS_PATH);
  }

  function renderConfirmation() {
    const booking = state.booking.data;
    const slot = state.booking.slot;
    const confirmed = booking.status === "confirmed";
    const rows = [
      ["Booking reference", booking.id],
      ["Provider", slot.provider],
      ["Date", formatDay(slot.start)],
      ["Time", formatTimeRange(slot) + " (" + TIMEZONE + ")"],
      ["Name", booking.name],
      ["Email", booking.email],
      ["Status", capitalise(booking.status)],
    ];
    const list = byId("confirmation");
    list.replaceChildren();
    for (const [label, value] of rows) {
      const row = make("div", "row");
      row.append(make("dt", null, label), make("dd", null, value));
      list.append(row);
    }
    byId("cancel-booking").hidden = !confirmed;
    renderConfirmationHeader(confirmed);
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
    if (result.status === 200) return markCancelled("Your booking has been cancelled and the time is free again.");
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

  setText("timezone", "Times shown in your timezone (" + TIMEZONE + ")");
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
