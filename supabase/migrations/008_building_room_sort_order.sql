-- Add sort_order to buildings and rooms for controlling display sequence
ALTER TABLE buildings ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 99;
ALTER TABLE rooms     ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 99;

-- Index for efficient ordering
CREATE INDEX IF NOT EXISTS idx_buildings_sort_order ON buildings (sort_order);
CREATE INDEX IF NOT EXISTS idx_rooms_sort_order     ON rooms     (sort_order);
