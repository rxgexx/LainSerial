const { obtenerBuyers } = require("../../sql/obtenerbuyers.js");

module.exports = async (bot) => {
  const buyers = await obtenerBuyers();

  const mensajeHTML = `🚨 <b>¡Atención! Reporta a tu revendedor</b> 🚨

Si estás usando este bot a través de un <b>revendedor no oficial</b> (es decir, alguien que te dio un número de teléfono y un código para acceder, pero no es la dueña oficial), ¡puedes reportarlo!

Contacta a la <b>única dueña oficial</b> 👉 <a href="https://t.me/SinFlowxr">@SinFlowxr</a> y envía pruebas del caso.

🎁 <b>¿Qué ganas al reportar?</b>
• Se te recompensará con <b>los días restantes</b> de tu compra actual.  
• Al terminar tu periodo, podrás <b>renovar al mismo precio</b> que pagaste originalmente.

¡Gracias por apoyar el uso justo y oficial del bot!`;

  // Función para enviar el mensaje a todos los buyers
  const enviarMensajeABuyers = async () => {
    for (const usuarioId of buyers) {
      try {
        await bot.sendMessage(usuarioId, mensajeHTML, { parse_mode: "HTML" });
      } catch (err) {
        console.error(`Error al enviar mensaje a ${usuarioId}:`, err.message);
      }
    }
  };

  // Enviar mensaje inmediatamente al iniciar
  await enviarMensajeABuyers();

  // Enviar cada 30 minutos
  setInterval(() => {
    enviarMensajeABuyers();
  }, 30 * 60 * 1000); // 30 minutos
};
