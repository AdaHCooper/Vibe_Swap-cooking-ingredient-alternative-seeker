-- Foods main table
CREATE TABLE IF NOT EXISTS catalog_foods (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  texture TEXT NOT NULL,
  fatty NUMERIC NOT NULL,
  umami NUMERIC NOT NULL,
  acidity NUMERIC NOT NULL,
  sweetness NUMERIC NOT NULL,
  wateriness NUMERIC NOT NULL,
  aroma NUMERIC NOT NULL,
  best_for TEXT NOT NULL,
  advantage TEXT NOT NULL,
  disadvantage TEXT NOT NULL,
  vibe_note TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_aliases (
  food_id TEXT NOT NULL REFERENCES catalog_foods(id) ON DELETE CASCADE,
  alias TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_cook_methods (
  food_id TEXT NOT NULL REFERENCES catalog_foods(id) ON DELETE CASCADE,
  method TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_dietary_tags (
  food_id TEXT NOT NULL REFERENCES catalog_foods(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_allergens (
  food_id TEXT NOT NULL REFERENCES catalog_foods(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS catalog_dimensions (
  key TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  weight NUMERIC NOT NULL,
  position INTEGER NOT NULL
);
