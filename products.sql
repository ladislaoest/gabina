-- 1. Crear la tabla de productos (si aún no existe)
-- Esta tabla almacenará todos los productos disponibles en la tienda.

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,          -- Identificador único para cada producto
    name TEXT NOT NULL,             -- Nombre del producto (ej. "Tomates Frescos")
    description TEXT,               -- Descripción detallada del producto
    stock INTEGER NOT NULL,         -- Cantidad disponible en inventario
    unit TEXT NOT NULL,             -- Unidad de medida (ej. "kg", "manojo", "unidad")
    image TEXT,                     -- URL de la imagen del producto
    created_at TIMESTAMPTZ DEFAULT NOW() -- Fecha de creación del registro
);

-- 2. Insertar productos de prueba
-- Estos son los datos de ejemplo que se mostrarán en la aplicación.

-- Limpiar la tabla antes de insertar para evitar duplicados si se corre el script varias veces
TRUNCATE TABLE products RESTART IDENTITY;

-- Insertar nuevos productos
INSERT INTO products (name, description, stock, unit, image) VALUES
('Tomates Cherry', 'Dulces y jugosos, perfectos para ensaladas o como snack.', 20, 'kg', 'https://images.unsplash.com/photo-1587496679742-96b9af94171b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Lechuga Romana', 'Crujiente y fresca, ideal para ensaladas César o sandwiches.', 15, 'unidades', 'https://images.unsplash.com/photo-1556801712-84351364584d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Zanahorias Orgánicas', 'Ricas en vitaminas y con un sabor dulce natural.', 30, 'kg', 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Pimientos Rojos', 'Carnosos y llenos de sabor, excelentes para asar o rellenar.', 25, 'unidades', 'https://images.unsplash.com/photo-1599229084149-7a79273a628d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60'),
('Calabacín Verde', 'Tierno y versátil, perfecto para cremas, salteados o a la plancha.', 18, 'kg', 'https://images.unsplash.com/photo-1581683459183-7858a70a2f3c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60');
