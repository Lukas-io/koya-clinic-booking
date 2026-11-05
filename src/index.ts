import { Clinic } from "./clinic";
import { PAGE_HTML } from "./page";
import { Result, errorResult } from "./result";

export { Clinic };

type Env = {
  CLINIC: DurableObjectNamespace<Clinic>;
  API_KEY?: string;
};

type Context = {
  request: Request;
  url: URL;
  clinic: DurableObjectStub<Clinic>;
  id: string;
};

type Handler = (context: Context) => Promise<Result> | Result;

type Route = {
  pattern: RegExp;
  handlers: Record<string, Handler>;
};

const PAGE_HEADERS = {
  "content-type": "text/html; charset=utf-8",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer",
  "cache-control": "no-store",
};

const searchParam = (url: URL, name: string) => url.searchParams.get(name);

const resetSlots: Handler = async ({ request, clinic }) =>
  clinic.reset(await request.text());

const listSlots: Handler = ({ url, clinic }) =>
  clinic.listSlots(searchParam(url, "provider"));

const createBooking: Handler = async ({ request, clinic }) =>
  clinic.createBooking(await request.text(), request.headers.get("Idempotency-Key"));

const createWebBooking: Handler = async (context) => {
  const address = context.request.headers.get("CF-Connecting-IP") ?? "unknown";
  const limited = await context.clinic.consumeIpAttempt(`ip:${address}`);
  return limited ?? createBooking(context);
};

const listBookings: Handler = ({ url, clinic }) =>
  clinic.listBookings(
    searchParam(url, "email"),
    searchParam(url, "limit"),
    searchParam(url, "cursor"),
  );

const getBooking: Handler = ({ clinic, id }) => clinic.getBooking(id);

const cancelBooking: Handler = ({ clinic, id }) => clinic.cancelBooking(id);

const apiRoutes: Route[] = [
  { pattern: /^\/reset$/, handlers: { POST: resetSlots } },
  { pattern: /^\/slots$/, handlers: { GET: listSlots } },
  { pattern: /^\/bookings$/, handlers: { POST: createBooking, GET: listBookings } },
  { pattern: /^\/bookings\/([^/]+)$/, handlers: { GET: getBooking, DELETE: cancelBooking } },
];

const webRoutes: Route[] = [
  { pattern: /^\/web\/slots$/, handlers: { GET: listSlots } },
  { pattern: /^\/web\/bookings$/, handlers: { POST: createWebBooking } },
  {
    pattern: /^\/web\/bookings\/([^/]+)$/,
    handlers: { GET: getBooking, DELETE: cancelBooking },
  },
];

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env);
    } catch {
      return toResponse(errorResult(500, "internal error"));
    }
  },
} satisfies ExportedHandler<Env>;

async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const clinic = env.CLINIC.get(env.CLINIC.idFromName("clinic"));
  if (url.pathname === "/") return servePage(request);
  const webResult = await dispatch(webRoutes, request, url, clinic);
  if (webResult) return toResponse(webResult);
  if (!(await isAuthorised(request, env))) {
    return toResponse(errorResult(401, "missing or invalid API key"));
  }
  const apiResult = await dispatch(apiRoutes, request, url, clinic);
  return toResponse(apiResult ?? errorResult(404, "not found"));
}

function servePage(request: Request): Response {
  if (request.method !== "GET") {
    return toResponse(methodNotAllowed(["GET"]));
  }
  return new Response(PAGE_HTML, { headers: PAGE_HEADERS });
}

async function dispatch(
  routes: Route[],
  request: Request,
  url: URL,
  clinic: DurableObjectStub<Clinic>,
): Promise<Result | null> {
  for (const route of routes) {
    const match = route.pattern.exec(url.pathname);
    if (!match) continue;
    if (!Object.hasOwn(route.handlers, request.method)) {
      return methodNotAllowed(Object.keys(route.handlers));
    }
    const id = decodeSegment(match[1] ?? "");
    return route.handlers[request.method]({ request, url, clinic, id });
  }
  return null;
}

function methodNotAllowed(allowed: string[]): Result {
  return errorResult(405, "method not allowed", { Allow: allowed.join(", ") });
}

function decodeSegment(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function toResponse(result: Result): Response {
  return new Response(result.body, {
    status: result.status,
    headers: { "content-type": "application/json", ...result.headers },
  });
}

async function isAuthorised(request: Request, env: Env): Promise<boolean> {
  const provided = request.headers.get("X-API-Key");
  if (!provided || !env.API_KEY) return false;
  return timingSafeEqual(provided, env.API_KEY);
}

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const [left, right] = await Promise.all([sha256(a), sha256(b)]);
  return crypto.subtle.timingSafeEqual(left, right);
}

function sha256(value: string): Promise<ArrayBuffer> {
  return crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
}
