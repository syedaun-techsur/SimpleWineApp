import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { apiError } from '@/lib/errors';

export async function GET(): Promise<NextResponse> {
  try {
    const CY = new Date().getFullYear();

    // Run all queries in parallel for performance
    const [
      statsResult,
      drinkNowResult,
      typeBreakdownResult,
      countryBreakdownResult,
      decadeBreakdownResult,
      recentlyAddedResult,
      recentlyConsumedResult,
      highestRatedResult,
    ] = await Promise.all([
      // ── Stat tiles ───────────────────────────────────────────────────────
      query(
        `SELECT
          COALESCE(SUM(quantity), 0)::int AS total_bottles,
          COUNT(*)::int AS unique_wines,
          COUNT(CASE WHEN
            (drinking_window_start IS NOT NULL AND drinking_window_end IS NOT NULL
              AND $1 >= drinking_window_start AND $1 <= drinking_window_end)
            OR (drinking_window_start IS NOT NULL AND drinking_window_end IS NULL
              AND $1 >= drinking_window_start)
            OR (drinking_window_end IS NOT NULL AND drinking_window_start IS NULL
              AND $1 <= drinking_window_end)
            THEN 1 END)::int AS drink_now_count,
          COUNT(CASE WHEN drinking_window_start IS NOT NULL
            AND $1 >= (drinking_window_start - 2)
            AND $1 < drinking_window_start
            THEN 1 END)::int AS approaching_peak_count
        FROM wines`,
        [CY]
      ),

      // ── Drink Now shelf (Wine objects with location_name JOIN) ────────────
      query(
        `SELECT w.id, w.name, w.producer, w.vintage, w.wine_type,
                w.grape, w.country, w.region, w.bottle_size,
                w.quantity, w.location_id,
                l.name AS location_name,
                w.purchase_date, w.purchase_source, w.purchase_price,
                w.drinking_window_start, w.drinking_window_end,
                w.notes, w.created_at, w.updated_at
         FROM wines w
         LEFT JOIN locations l ON w.location_id = l.id
         WHERE
           (w.drinking_window_start IS NOT NULL AND w.drinking_window_end IS NOT NULL
             AND $1 >= w.drinking_window_start AND $1 <= w.drinking_window_end)
           OR (w.drinking_window_start IS NOT NULL AND w.drinking_window_end IS NULL
             AND $1 >= w.drinking_window_start)
           OR (w.drinking_window_end IS NOT NULL AND w.drinking_window_start IS NULL
             AND $1 <= w.drinking_window_end)
         ORDER BY w.name ASC`,
        [CY]
      ),

      // ── Type breakdown ────────────────────────────────────────────────────
      query(
        `SELECT wine_type, COUNT(*)::int AS wine_count,
                COALESCE(SUM(quantity), 0)::int AS bottle_count
         FROM wines GROUP BY wine_type ORDER BY bottle_count DESC`
      ),

      // ── Country/region breakdown (top 10) ─────────────────────────────────
      query(
        `SELECT COALESCE(country, 'Unknown') AS country, COUNT(*)::int AS wine_count
         FROM wines GROUP BY country ORDER BY wine_count DESC LIMIT 10`
      ),

      // ── Decade breakdown ──────────────────────────────────────────────────
      query(
        `SELECT (FLOOR(vintage / 10) * 10)::int AS decade, COUNT(*)::int AS wine_count
         FROM wines WHERE vintage IS NOT NULL
         GROUP BY decade ORDER BY decade DESC`
      ),

      // ── Recently Added (5 wines) ──────────────────────────────────────────
      query(
        `SELECT w.id, w.name, w.producer, w.vintage, w.wine_type,
                w.grape, w.country, w.region, w.bottle_size,
                w.quantity, w.location_id,
                l.name AS location_name,
                w.purchase_date, w.purchase_source, w.purchase_price,
                w.drinking_window_start, w.drinking_window_end,
                w.notes, w.created_at, w.updated_at
         FROM wines w
         LEFT JOIN locations l ON w.location_id = l.id
         ORDER BY w.created_at DESC LIMIT 5`
      ),

      // ── Recently Consumed (5 events) ──────────────────────────────────────
      query(
        `SELECT be.id AS event_id, be.event_type, be.event_date,
                w.id AS wine_id, w.name AS wine_name, w.producer, w.vintage
         FROM bottle_events be
         JOIN wines w ON be.wine_id = w.id
         WHERE be.event_type IN ('Consumed', 'Gifted')
         ORDER BY be.event_date DESC, be.created_at DESC LIMIT 5`
      ),

      // ── Highest Rated (top 5 by most-recent tasting note rating) ──────────
      // Uses DISTINCT ON to get most recent note per wine, then outer sort by rating DESC
      query(
        `SELECT wine_id, wine_name, producer, vintage, rating, tasted_on
         FROM (
           SELECT DISTINCT ON (tn.wine_id)
             tn.wine_id,
             w.name AS wine_name,
             w.producer,
             w.vintage,
             tn.rating,
             tn.tasted_on
           FROM tasting_notes tn
           JOIN wines w ON tn.wine_id = w.id
           ORDER BY tn.wine_id, tn.tasted_on DESC, tn.created_at DESC
         ) most_recent
         WHERE rating IS NOT NULL
         ORDER BY rating DESC
         LIMIT 5`
      ),
    ]);

    const statsRow = statsResult.rows[0];

    return NextResponse.json({
      stats: {
        total_bottles: statsRow.total_bottles,
        unique_wines: statsRow.unique_wines,
        drink_now_count: statsRow.drink_now_count,
        approaching_peak_count: statsRow.approaching_peak_count,
      },
      drink_now_wines: drinkNowResult.rows,
      type_breakdown: typeBreakdownResult.rows,
      country_breakdown: countryBreakdownResult.rows,
      decade_breakdown: decadeBreakdownResult.rows,
      recently_added: recentlyAddedResult.rows,
      recently_consumed: recentlyConsumedResult.rows,
      highest_rated: highestRatedResult.rows,
    });
  } catch (err) {
    console.error('GET /api/dashboard error:', err);
    return apiError(500, 'DB_READ_ERROR', 'Could not load dashboard. Please try again.');
  }
}
