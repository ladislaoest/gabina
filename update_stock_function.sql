-- 1. Habilitar el lenguaje plpgsql si no está habilitado
CREATE EXTENSION IF NOT EXISTS plpgsql;

-- 2. Crear la función para confirmar la reserva y actualizar el stock (versión corregida)
-- Se añade el parámetro p_user_name para registrar quién hace el pedido.
CREATE OR REPLACE FUNCTION confirm_reservation_and_update_stock(
    p_user_id TEXT,         -- El ID del usuario que hace la reserva
    p_user_name TEXT,       -- El NOMBRE del usuario que hace la reserva
    p_items JSONB           -- Un array JSON con los productos del carrito
)
RETURNS VOID AS $$
DECLARE
    item JSONB;
    product_id_to_update INT; -- Se cambia a INT para que coincida con el tipo de la tabla products
    quantity_to_decrement INT;
    current_stock INT;
BEGIN
    -- Iterar sobre cada producto en el carrito (el array JSON)
    FOR item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Extraer el ID y la cantidad de cada producto
        product_id_to_update := (item->>'productId')::INT;
        quantity_to_decrement := (item->>'quantity')::INT;

        -- Paso crítico: Revisar el stock actual y bloquear la fila para evitar que otros procesos la modifiquen
        SELECT stock INTO current_stock FROM products WHERE id = product_id_to_update FOR UPDATE;

        -- Si no hay suficiente stock, detener todo y lanzar un error
        IF current_stock < quantity_to_decrement THEN
            RAISE EXCEPTION 'Stock insuficiente para el producto ID %. Cantidad disponible: %, se intentó reservar: %', product_id_to_update, current_stock, quantity_to_decrement;
        END IF;

        -- Si hay stock, actualizar la tabla de productos
        UPDATE products
        SET stock = stock - quantity_to_decrement
        WHERE id = product_id_to_update;
    END LOOP;

    -- Si todas las actualizaciones de stock fueron exitosas, insertar la reserva final
    INSERT INTO reservations (user_id, user_name, items, status)
    VALUES (p_user_id, p_user_name, p_items, 'pending');
END;
$$ LANGUAGE plpgsql;