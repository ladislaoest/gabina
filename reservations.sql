-- Crear la tabla de reservaciones si no existe
CREATE TABLE IF NOT EXISTS reservations (
    id SERIAL PRIMARY KEY,
    user_id TEXT,
    user_name TEXT, -- Añadido para guardar el nombre del usuario
    items JSONB,
    status TEXT,
    date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asegurarse de que la columna user_name exista en la tabla
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_attribute WHERE attrelid = 'reservations'::regclass AND attname = 'user_name' AND NOT attisdropped) THEN
        ALTER TABLE reservations ADD COLUMN user_name TEXT;
    END IF;
END $$;
