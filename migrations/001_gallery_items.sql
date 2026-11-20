CREATE TABLE IF NOT EXISTS gallery_items (
  id UUID PRIMARY KEY,
  name VARCHAR(80) NOT NULL,
  price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS gallery_items_created_at_idx
  ON gallery_items (created_at DESC, id DESC);
