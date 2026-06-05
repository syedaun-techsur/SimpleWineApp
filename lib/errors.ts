import { NextResponse } from 'next/server';

interface ApiErrorBody {
  error: string;
  message: string;
  fields?: Record<string, string>;
}

/**
 * Standard API error response.
 * TechArch §4.1 standard error shape: { error: ERROR_CODE, message: string, fields?: Record<string,string> }
 */
export function apiError(
  status: number,
  code: string,
  message: string,
  fields?: Record<string, string>
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = { error: code, message };
  if (fields && Object.keys(fields).length > 0) body.fields = fields;
  return NextResponse.json(body, { status });
}

/**
 * Shorthand for 422 Unprocessable Entity with field-level errors.
 */
export function validationError(fields: Record<string, string>): NextResponse<ApiErrorBody> {
  return apiError(422, 'VALIDATION_ERROR', 'Validation failed.', fields);
}
