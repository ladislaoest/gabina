-- Este script corrige las URLs de las imágenes para los productos de ejemplo.
UPDATE products 
SET image = 'https://images.unsplash.com/photo-1587496679742-96b9af94171b?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
WHERE name = 'Tomates Cherry';

UPDATE products 
SET image = 'https://images.unsplash.com/photo-1556801712-84351364584d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
WHERE name = 'Lechuga Romana';

UPDATE products 
SET image = 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
WHERE name = 'Zanahorias Orgánicas';

UPDATE products 
SET image = 'https://images.unsplash.com/photo-1599229084149-7a79273a628d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
WHERE name = 'Pimientos Rojos';

UPDATE products 
SET image = 'https://images.unsplash.com/photo-1581683459183-7858a70a2f3c?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60' 
WHERE name = 'Calabacín Verde';
