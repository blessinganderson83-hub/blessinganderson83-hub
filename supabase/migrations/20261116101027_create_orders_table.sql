/*
# Create orders table

1. New Tables
- `orders`: one row per customer order.
  - `id` (uuid, primary key)
  - `customer_name` (text, required)
  - `phone` (text, optional)
  - `product_id` (uuid, optional, references products.id, set to null if the product is deleted)
  - `product_name` (text, snapshot of the product name at order time)
  - `unit_price` (numeric, snapshot of the price at order time, must be >= 0)
  - `quantity` (integer, must be >= 1)
  - `total` (numeric, unit_price x quantity, must be >= 0)
  - `status` (text: pending, confirmed, delivered, cancelled)
  - `lead_id` (uuid, optional, references leads.id, set to null if the lead is deleted)
  - `notes` (text, optional)
  - `is_demo` (boolean)
  - `created_at`, `updated_at` (timestamps)

2. Security
- Enable RLS on `orders`.
- Grant SELECT, INSERT, UPDATE, DELETE to `anon` and `authenticated`, matching the other tables (the app has no sign-in).
- Four policies (select, insert, update, delete) for both roles.

3. Notes
- Price and product name are copied onto the order so later catalogue edits do not change past orders.
- Demo orders are seeded with `is_demo = true` and are only inserted when no demo orders exist yet.
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  unit_price numeric NOT NULL CHECK (unit_price >= 0),
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  total numeric NOT NULL CHECK (total >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
  notes text,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_product_id_idx ON orders (product_id);
CREATE INDEX IF NOT EXISTS orders_lead_id_idx ON orders (lead_id);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON orders TO anon, authenticated;

DROP POLICY IF EXISTS "public_select_orders" ON orders;
CREATE POLICY "public_select_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "public_insert_orders" ON orders;
CREATE POLICY "public_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "public_update_orders" ON orders;
CREATE POLICY "public_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "public_delete_orders" ON orders;
CREATE POLICY "public_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

INSERT INTO orders (customer_name, phone, product_id, product_name, unit_price, quantity, total, status, notes, is_demo)
SELECT 'Chinwe Eze', '0806 555 1204', p.id, p.name, p.price, 2, p.price * 2, 'confirmed', 'Wants delivery to Enugu by Friday.', true
FROM products p
WHERE p.name = 'Ankara Fabric (6 Yards)'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE is_demo = true);

INSERT INTO orders (customer_name, phone, product_id, product_name, unit_price, quantity, total, status, notes, is_demo)
SELECT 'Tunde Adebayo', '0701 234 9876', p.id, p.name, p.price, 1, p.price, 'pending', 'Asked for a discount on bulk orders.', true
FROM products p
WHERE p.name = 'Handmade Shea Butter 500g'
  AND NOT EXISTS (SELECT 1 FROM orders WHERE is_demo = true AND customer_name = 'Tunde Adebayo');
