export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): Response {
  const body: { error: string; message: string; fields?: Record<string, string> } = {
    error: code,
    message,
  };
  if (fields && Object.keys(fields).length > 0) {
    body.fields = fields;
  }
  return Response.json(body, { status });
}
