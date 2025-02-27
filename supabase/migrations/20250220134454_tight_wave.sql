/*
  # Create WMS Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `sku` (text, unique)
      - `location` (text)
      - `category` (text)
      - `logistics_unit_quantity` (integer)
      - `sales_unit_quantity` (integer)
      - `logistics_unit_stock` (integer)
      - `sales_unit_stock` (integer)
      - `consumption_unit_stock` (integer)
      - `created_at` (timestamptz)

    - `movements`
      - `id` (uuid, primary key)
      - `product_id` (uuid, foreign key)
      - `type` (text)
      - `quantity` (integer)
      - `unit_type` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read and modify data
*/

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sku text UNIQUE NOT NULL,
  location text NOT NULL,
  category text NOT NULL,
  logistics_unit_quantity integer DEFAULT 1,
  sales_unit_quantity integer DEFAULT 1,
  logistics_unit_stock integer DEFAULT 0,
  sales_unit_stock integer DEFAULT 0,
  consumption_unit_stock integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create movements table
CREATE TABLE IF NOT EXISTS movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  type text CHECK (type IN ('entrada', 'salida')) NOT NULL,
  quantity integer NOT NULL,
  unit_type text CHECK (unit_type IN ('logistics', 'sales', 'consumption')) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Create policies for products
CREATE POLICY "Enable read access for authenticated users"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

-- Create policies for movements
CREATE POLICY "Enable read access for authenticated users"
  ON movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for authenticated users"
  ON movements FOR INSERT
  TO authenticated
  WITH CHECK (true);
