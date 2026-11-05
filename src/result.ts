export type Result = {
  status: number;
  body: string;
  headers?: Record<string, string>;
};

export function jsonResult(
  status: number,
  payload: unknown,
  headers?: Record<string, string>,
): Result {
  return { status, body: JSON.stringify(payload), headers };
}

export function errorResult(
  status: number,
  message: string,
  headers?: Record<string, string>,
): Result {
  return jsonResult(status, { error: message }, headers);
}
