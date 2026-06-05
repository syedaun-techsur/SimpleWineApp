-- ============================================================
-- 003_create_bottle_events.sql
-- Immutable audit log of bottle removal events per wine.
-- ============================================================

CREATE TABLE IF NOT EXISTS bottle_events (
  id          SERIAL PRIMARY KEY,
  wine_id     INTEGER NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  event_type  VARCHAR(20) NOT NULL
                CHECK (event_type IN ('Consumed','Gifted','Opened')),
  event_date  DATE NOT NULL DEFAULT CURRENT_DATE,
  note        VARCHAR(500),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bottle_events_wine_id    ON bottle_events(wine_id);
CREATE INDEX IF NOT EXISTS idx_bottle_events_event_date ON bottle_events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_bottle_events_event_type ON bottle_events(event_type);
