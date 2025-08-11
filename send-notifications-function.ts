import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import webpush from "https://deno.land/x/webpush/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Estos valores VAPID deben ser los mismos que en tu cliente.
// ¡IMPORTANTE! No expongas tu clave privada en el lado del cliente.
const vapidKeys = {
  publicKey: "BDhIwfGYN_yI19ZhRpDCci7yTlWF-CiSW6wHzYW8FC1N9P94V2dl54JjEPZYagd6zolm4Ghgn_-KYEd5AzYQ4Pw",
  privateKey: "uNDPc05ziUhUXCWdF_deuvHI206cSnC19btlD-fp1g0" // <-- ¡REEMPLAZA ESTO!
};

// Configura los detalles para el envío de notificaciones.
const webPushOptions = {
    vapidDetails: {
        subject: 'mailto:tu-email@example.com', // <-- REEMPLAZA con tu email
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey
    }
};

serve(async (req) => {
  try {
    // Conectarse a Supabase (asumiendo que las variables de entorno están configuradas en Supabase)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { user_id, payload } = await req.json();

    let query = supabase.from('push_subscriptions').select('subscription');

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      throw new Error(`Error al obtener las suscripciones: ${error.message}`);
    }

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: "No hay suscriptores a los que notificar." }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    const notificationPayload = JSON.stringify(payload || {
      title: "¡Novedades en la Huerta!",
      body: "¡Tenemos nuevos productos frescos esperándote!",
      icon: "/img1.png",
      badge: "/img1.png"
    });

    const promises = subscriptions.map(s => 
      webpush.sendNotification(s.subscription, notificationPayload, webPushOptions)
        .catch(err => console.error(`No se pudo enviar la notificación a ${s.subscription.endpoint}:`, err))
    );

    await Promise.all(promises);

    console.log(`${subscriptions.length} notificaciones enviadas.`);

    return new Response(JSON.stringify({ message: "Notificaciones enviadas con éxito" }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
});
