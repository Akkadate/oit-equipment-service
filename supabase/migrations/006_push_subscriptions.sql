-- Migration: เพิ่มตาราง push_subscriptions สำหรับ Web Push Notifications
-- เก็บ subscription ของ admin/staff แต่ละคน (per browser/device)

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL,                -- Supabase Auth user id
  endpoint   TEXT        UNIQUE NOT NULL,         -- Push service URL (browser-specific)
  p256dh     TEXT        NOT NULL,               -- ECDH public key
  auth_key   TEXT        NOT NULL,               -- Auth secret
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx ON push_subscriptions (user_id);

-- RLS
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- เฉพาะ admin/staff อ่าน/เขียน subscription ของตัวเอง
CREATE POLICY "push_sub_select" ON push_subscriptions FOR SELECT
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "push_sub_insert" ON push_subscriptions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'staff'));

CREATE POLICY "push_sub_delete" ON push_subscriptions FOR DELETE
  USING (auth.jwt() ->> 'role' IN ('admin', 'staff'));
