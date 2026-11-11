/*
# Add product images

1. Plain-English explanation
Products can now have an optional picture. A new column stores the image
reference for each product, and the demo products get real photos so the
catalogue looks alive out of the box.

2. Modified Tables
- `products`: adds `image_url` (text, optional) — holds an image URL or a
  local data reference for the product picture.

3. Security
- No policy changes. The column rides the existing table grants and the
  "all columns" privileges the table already grants.

4. Notes
- Idempotent: the column is only added if it does not already exist.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'products' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE products ADD COLUMN image_url text;
  END IF;
END $$;

UPDATE products SET image_url = CASE name
  WHEN 'Ankara Fabric (6 Yards)' THEN 'https://images.pexels.com/photos/12477588/pexels-photo-12477588.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  WHEN 'Handmade Shea Butter 500g' THEN 'https://images.pexels.com/photos/30754235/pexels-photo-30754235.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  WHEN 'Wireless Earbuds Pro' THEN 'https://images.pexels.com/photos/33797659/pexels-photo-33797659.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
  WHEN 'Aso-Oke Agbada Set' THEN 'https://images.pexels.com/photos/37340988/pexels-photo-37340988.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
END
WHERE is_demo = true AND image_url IS NULL;
