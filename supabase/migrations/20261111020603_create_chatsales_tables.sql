/*
# Create ChatSales AI tables (products, faqs, leads) — single-tenant, no auth

1. Plain-English explanation
This migration creates the three data tables the ChatSales AI app needs:
a product catalogue, an FAQ library, and customer leads. It also seeds a
small set of clearly-labelled demo rows so the app looks alive on first run.

2. New Tables
- `products`: items the business sells.
  - `id` (uuid, primary key)
  - `name` (text, not null) — product name
  - `price` (numeric, not null) — price in Naira
  - `description` (text) — short description
  - `stock` (text) — availability note, e.g. "In stock"
  - `is_demo` (boolean, default false) — marks rows as demo data
  - `created_at` (timestamp)
- `faqs`: frequently asked questions with saved answers.
  - `id`, `is_demo`, `created_at` as above
  - `question` (text, not null)
  - `answer` (text, not null)
  - `category` (text) — grouping label, e.g. "Delivery"
- `leads`: customer enquiries and their status.
  - `id`, `is_demo`, `created_at` as above
  - `name` (text, not null) — customer name
  - `phone` (text) — WhatsApp/phone number
  - `message` (text, not null) — their enquiry
  - `status` (text, default 'new') — new | replied | won | closed

3. Security
- RLS enabled on all three tables.
- This app has no sign-in screen, so it runs as the anon role for its whole
  lifetime: policies are `TO anon, authenticated` and intentionally allow
  full CRUD because the data is shared single-workspace data by design.
- Explicit GRANTs for SELECT/INSERT/UPDATE/DELETE to anon + authenticated.

4. Notes
- All statements are idempotent (IF NOT EXISTS / DROP POLICY IF EXISTS).
- Seed rows use `is_demo = true` so the UI can label them as demo data.
*/

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric NOT NULL CHECK (price >= 0),
  description text DEFAULT '',
  stock text DEFAULT 'In stock',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  category text DEFAULT 'General',
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'replied', 'won', 'closed')),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON products TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON faqs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON leads TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_products" ON products;
CREATE POLICY "public_select_products" ON products FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_products" ON products;
CREATE POLICY "public_insert_products" ON products FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_products" ON products;
CREATE POLICY "public_update_products" ON products FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_products" ON products;
CREATE POLICY "public_delete_products" ON products FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_faqs" ON faqs;
CREATE POLICY "public_select_faqs" ON faqs FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_faqs" ON faqs;
CREATE POLICY "public_insert_faqs" ON faqs FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_faqs" ON faqs;
CREATE POLICY "public_update_faqs" ON faqs FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_faqs" ON faqs;
CREATE POLICY "public_delete_faqs" ON faqs FOR DELETE
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_select_leads" ON leads;
CREATE POLICY "public_select_leads" ON leads FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_leads" ON leads;
CREATE POLICY "public_insert_leads" ON leads FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_leads" ON leads;
CREATE POLICY "public_update_leads" ON leads FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_leads" ON leads;
CREATE POLICY "public_delete_leads" ON leads FOR DELETE
TO anon, authenticated USING (true);

-- Demo seed data (clearly labelled with is_demo = true)
INSERT INTO products (name, price, description, stock, is_demo)
SELECT * FROM (VALUES
  ('Ankara Fabric (6 Yards)', 15000.00, 'Premium quality Ankara print fabric, 6 yards per piece.', 'In stock', true),
  ('Handmade Shea Butter 500g', 3500.00, '100% natural unrefined shea butter from Northern Nigeria.', 'In stock', true),
  ('Wireless Earbuds Pro', 18500.00, 'Bluetooth 5.3 earbuds with noise cancellation and charging case.', 'Low stock', true),
  ('Aso-Oke Agbada Set', 45000.00, 'Traditional three-piece Agbada set, made to order in Lagos.', 'Made to order', true)
) AS seed(name, price, description, stock, is_demo)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE is_demo = true);

INSERT INTO faqs (question, answer, category, is_demo)
SELECT * FROM (VALUES
  ('How long does delivery take?', 'Delivery within Lagos takes 1-2 working days. Other states take 3-5 working days via GIG or Peace Mass.', 'Delivery', true),
  ('Do you offer pay on delivery?', 'Yes, pay on delivery is available within Lagos for orders under ₦50,000. Outside Lagos, we require full payment upfront.', 'Payment', true),
  ('Can I get a discount for bulk orders?', 'Yes! Orders of 5 pieces or more get 10% off. Orders of 20+ pieces get 15% off. Message us for a custom quote.', 'Pricing', true)
) AS seed(question, answer, category, is_demo)
WHERE NOT EXISTS (SELECT 1 FROM faqs WHERE is_demo = true);

INSERT INTO leads (name, phone, message, status, is_demo)
SELECT * FROM (VALUES
  ('Chidinma Okafor', '0803 123 4567', 'Hello, please how much is the Ankara fabric? Do you have it in blue?', 'new', true),
  ('Musa Ibrahim', '0706 987 6543', 'Good day, I want to order 10 pieces of shea butter. Is there a bulk discount?', 'replied', true),
  ('Tolu Adeyemi', '0810 555 0192', 'Does the wireless earbuds come with a warranty?', 'new', true)
) AS seed(name, phone, message, status, is_demo)
WHERE NOT EXISTS (SELECT 1 FROM leads WHERE is_demo = true);
