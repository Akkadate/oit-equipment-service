-- Add sort_order to campuses for controlling display sequence
ALTER TABLE campuses ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 99;

-- Set initial values for existing campuses (adjust codes to match your data)
-- UPDATE campuses SET sort_order = 1 WHERE code = 'NBK-SAPHAN';   -- วิทยาเขตสะพานใหม่
-- UPDATE campuses SET sort_order = 2 WHERE code = 'NBK-RANGSIT'; -- วิทยาเขตรังสิต
-- UPDATE campuses SET sort_order = 3 WHERE code = 'NBK-NONTHABURI'; -- ศูนย์นนทบุรี
