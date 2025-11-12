const cron = require("node-cron");
const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");
const { obtenerStarts } = require("../../sql/obtenerstarts.js");

module.exports = async (bot) => {
  const mensajeHTML = `
🚨 <b>¡ATENCIÓN! NUEVO BOT DISPONIBLE</b> 🚨

🛰️ <b>Nuevo bot oficial:</b> <a href="https://t.me/LainData_Bot">@LainData_Bot</a> 👈👈👈  

Por favor, inicia y regístrate en el nuevo bot.  
Este nuevo sistema cuenta con:
• Mayor compatibilidad ⚙️  
• Más estabilidad 🚀  
• Nuevos comandos mejorados 🌐  

📅 <b>IMPORTANTE:</b> Este bot será apagado oficialmente el <b>VIERNES 14</b>.  
Solicita la migración de tu cuenta con tu vendedor para conservar tu membresía y créditos.  

⚠️ <b>ES DE SUMA IMPORTANCIA</b> que te unas a nuestros canales oficiales para mantenerte informado sobre:
• Migraciones  
• Anuncios y precios actualizados  
• Nuevas funciones y beneficios exclusivos 💎  

<b>👉 No pierdas tus actualizaciones ni soporte, únete ahora.</b>
`;

  // 🔘 Botones públicos (para todos)
  const botonesPublicos = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📣 Canal oficial", url: "https://t.me/+_NYjIVJOh5Y2MWNh" },
          { text: "🌐 Grupo público", url: "https://t.me/+tdHO880Bpwg0NTUx" },
        ],
      ],
    },
  };

  // 💎 Botones para buyers (añade grupo clientes)
  const botonesBuyers = {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "📣 Canal oficial", url: "https://t.me/+_NYjIVJOh5Y2MWNh" },
          { text: "🌐 Grupo público", url: "https://t.me/+tdHO880Bpwg0NTUx" },
        ],
        [
          { text: "💎 Grupo de clientes", url: "https://t.me/+hhOCD6euE5xkNzRh" },
        ],
      ],
    },
  };

  // 🧱 Función: enviar mensaje a BUYERS
  const enviarMensajeABuyers = async () => {
    try {
      const buyers = await obtenerBuyers();
      console.log(`📤 Enviando a ${buyers.length} compradores...`);

      let enviados = 0;
      for (const usuarioId of buyers) {
        try {
          await bot.sendMessage(usuarioId, mensajeHTML, botonesBuyers);
          enviados++;
          await new Promise((r) => setTimeout(r, 400));
        } catch (err) {
          console.error(`⚠️ Error al enviar mensaje a buyer ${usuarioId}:`, err.message);
        }
      }

      console.log(`✅ Mensajes enviados a buyers: ${enviados}`);
    } catch (err) {
      console.error("❌ Error al obtener lista de buyers:", err.message);
    }
  };

  // 🧱 Función: enviar mensaje a usuarios con /start
  const enviarMensajeStart = async () => {
    try {
      const starts = await obtenerStarts();
      console.log(`📤 Enviando a ${starts.length} usuarios con /start...`);

      let enviados = 0;
      for (const usuarioId of starts) {
        try {
          await bot.sendMessage(usuarioId, mensajeHTML, botonesPublicos);
          enviados++;
          await new Promise((r) => setTimeout(r, 400));
        } catch (err) {
          console.error(`⚠️ Error al enviar mensaje a usuario ${usuarioId}:`, err.message);
        }
      }

      console.log(`✅ Mensajes enviados a iniciados: ${enviados}`);
    } catch (err) {
      console.error("❌ Error al obtener lista de starts:", err.message);
    }
  };

  // 🕐 Programar envío automático a las 12:00 PM y 6:00 PM (hora Perú)
  cron.schedule(
    "0 12,18 * * *",
    async () => {
      console.log("⏰ Ejecutando envío automático (12:00 / 18:00)...");
      await enviarMensajeABuyers();
      await enviarMensajeStart();
      console.log("✅ Envío completado correctamente.");
    },
    {
      timezone: "America/Lima",
    }
  );
};
