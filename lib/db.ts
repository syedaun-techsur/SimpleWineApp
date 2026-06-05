import { Pool, QueryResult, QueryResultRow } from 'pg';

let _pool: Pool | null = null;

function getPool(): Pool {
  if (!_pool) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    _pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }
  return _pool;
}

/**
 * Parameterized query helper — never use string interpolation for user data.
 * TechArch §5.3: all DB access via parameterized queries only.
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

// Named pool export for raw access if needed
export const pool = {
  query: (text: string, params?: unknown[]) => getPool().query(text, params),
  connect: () => getPool().connect(),
};

// Backwards-compatible alias for wave 2a code using `db`
export const db = pool;
