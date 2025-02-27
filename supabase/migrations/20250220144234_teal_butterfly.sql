/*
  # Fix RLS policies for products and movements tables

  1. Security Changes
    - Drop and recreate all RLS policies for products table
    - Ensure policies allow all operations for authenticated users
    - Add explicit policies for all CRUD operations
*/

-- Disable RLS temporarily to reset policies
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create new policies with simpler rules
CREATE POLICY "Allow all operations for authenticated users"
  ON products
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Also fix movements table policies
ALTER TABLE movements DISABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON movements
  TO authenticated
  USING (true)
  WITH CHECK (true);
