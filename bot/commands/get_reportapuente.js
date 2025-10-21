const cron = require("node-cron");
const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");

module.exports = async (bot) => {
  const mensajeHTML = `🚨 <b>¡Atención! Reporta a tu revendedor</b> 🚨

Si estás usando este bot a través de un <b>revendedor no oficial</b> (alguien que te dio un número y un código para acceder, pero no es la dueña oficial), <b>¡puedes reportarlo!</b>

📩 Contacta a la <b>única dueña oficial</b> 👉 <a href="tg://user?id=8194230892">@SxnFlowxr</a> y envía pruebas del caso.

🎁 <b>¿Qué ganas al reportar?</b>
• Recuperas los <b>días restantes</b> de tu compra.  
• Al vencer tu acceso, podrás <b>renovar al mismo precio</b> que pagaste originalmente.

🙏 ¡Gracias por apoyar el uso legal y justo del bot!`;

  const enviarMensajeABuyers = async () => {
    try {
      const buyers = await obtenerBuyers();
      for (const usuarioId of buyers) {
        try {
          await bot.sendMessage(usuarioId, mensajeHTML, { parse_mode: "HTML" });
        } catch (err) {
          console.error(`Error al enviar mensaje a ${usuarioId}:`, err.message);
        }
      }
    } catch (err) {
      console.error("Error al obtener la lista de buyers:", err.message);
    }
  };

  // Programar tareas a las 12:00 PM y 6:00 PM hora Perú (GMT-5)
  cron.schedule("0 12,18 * * *", async () => {
    await enviarMensajeABuyers();
  }, {
    timezone: "America/Lima"
  });
};
