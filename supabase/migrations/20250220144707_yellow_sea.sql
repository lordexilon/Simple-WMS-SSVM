/*
  # Agregar columna unit_type a la tabla movements

  1. Cambios
    - Agregar columna `unit_type` a la tabla `movements`
    - Establecer valores permitidos: 'logistics', 'sales', 'consumption'
    - Hacer la columna NOT NULL
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'movements' 
    AND column_name = 'unit_type'
  ) THEN
    ALTER TABLE movements 
    ADD COLUMN unit_type text 
    CHECK (unit_type IN ('logistics', 'sales', 'consumption')) 
    NOT NULL;
  END IF;
END $$;
