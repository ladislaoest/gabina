-- Crear la tabla de usuarios si no existe
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    user_id TEXT UNIQUE,
    user_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
