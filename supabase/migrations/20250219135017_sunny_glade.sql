/*
  # WMS Basic Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `quantity` (integer)
      - `location` (text)
      - `category` (text)
      - `created_at` (timestamp)  
      - `logistics_unit_quantity` (int8)
      - `sales_unit_quantity` (int8)
      - `logistics_unit_stock` (int8)
      - `sales_unit_stock` (int8)
      - `consumption_unit_stock` (int8)
    
    - `movements`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `type` (text)
      - `quantity` (integer)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  quantity integer DEFAULT 0,
  location text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now(),
  logistics_unit_quantity  integer DEFAULT 0,
  sales_unit_quantity  integer DEFAULT 0,
  logistics_unit_stock  integer DEFAULT 0,
  sales_unit_stock  integer DEFAULT 0,
  consumption_unit_stock  integer DEFAULT 0
);

-- Create movements table
CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  type text CHECK (type IN ('entrada', 'salida')) NOT NULL,
  quantity integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read movements"
  ON movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert movements"
  ON movements FOR INSERT
  TO authenticated
  WITH CHECK (true);
