/*
  # Update RLS policies for products table

  1. Security Changes
    - Drop existing RLS policies for products table
    - Add new policies for all CRUD operations
    - Ensure authenticated users can perform all operations
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON products;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON products;

-- Create new policies
CREATE POLICY "Enable read access for all users"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert access for all users"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update access for all users"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable delete access for all users"
  ON products FOR DELETE
  TO authenticated
  USING (true);
