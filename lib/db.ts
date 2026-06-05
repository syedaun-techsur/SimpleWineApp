import { Pool, QueryResult, QueryResultRow } from 'pg';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Parameterized query helper — never use string interpolation for user data.
 * TechArch §5.3: all DB access via parameterized queries only.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return pool.query<T>(text, params);
}

// Named pool export for raw access if needed
export { pool };

// Backwards-compatible alias for wave 2a code using `db`
export const db = pool;
